import { Inject, Injectable } from '@nestjs/common';
import { InterfaceReadingUseCase } from '../usecases/reading.use-case.interface';
import { CreateReadingLegacyRequest } from '../../domain/schemas/dto/request/create.reading.request';
import {
  PaymentReadingResponse,
  PaymentResponse,
  PendingReadingResponse,
  ReadingResponse,
} from '../../domain/schemas/dto/response/readings.response';
import { InterfaceReadingsRepository } from '../../domain/contracts/readings.interface.repository';
import { ReadingModel } from '../../domain/schemas/model/sqlserver/reading.model';
import { ReadingMapper } from '../mappers/readings.mapper';
import { validateFields } from '../../../../shared/validators/fields.validators';
import { statusCode } from '../../../../settings/environments/status-code';
import { MONTHS } from '../../../../shared/consts/months';
import { FindCurrentReadingParams } from '../../domain/schemas/dto/request/find-current-reading.paramss';
import { UpdateReadingRequest } from '../../domain/schemas/dto/request/update.reading.request';
import { ReadingNotFoundException } from '../../domain/exceptions/reading-not-found.exception';
import { RpcException } from '@nestjs/microservices';
import { InterfaceExternalPayrollRepository } from '../../domain/contracts/external-payroll.interface.repository';
import { InterfaceEntryDataRepository } from '../../domain/contracts/entry-data.interface.repository';
import { InterfaceEntryDataUseCase } from '../usecases/entry-data.use-case.interface';
import {
  DailyCollectorSummary,
  DailyGroupedReport,
  DailyPaymentMethodReport,
  DateRangeParams,
  FullBreakdownReport,
} from '../../domain/schemas/dto/response/entry-data.response';

@Injectable()
export class ReadingService
  implements InterfaceReadingUseCase, InterfaceEntryDataUseCase
{
  constructor(
    @Inject('ReadingsRepository')
    private readonly readingsRepository: InterfaceReadingsRepository,
    @Inject('ExternalPayrollRepository')
    private readonly externalPayrollRepository: InterfaceExternalPayrollRepository,
    @Inject('EntryDataRepository')
    private readonly entryDataRepository: InterfaceEntryDataRepository,
  ) {}

  createReading(request: CreateReadingLegacyRequest): Promise<ReadingResponse> {
    try {
      const requiredFields: string[] = [
        'previousReading',
        'currentReading',
        'cadastralKey',
        'novelty',
      ];

      const missingFieldsMessages: string[] = validateFields(
        request,
        requiredFields,
      );
      if (missingFieldsMessages.length > 0) {
        throw new Error(JSON.stringify(missingFieldsMessages));
      }

      const now: Date = new Date();
      const hour: string = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Guayaquil',
      }).format(now);
      request.readingTime = hour;
      request.readingDate = now;
      request.readingTime = hour;
      request.month = MONTHS[now.getMonth() + 1];
      request.year = now.getFullYear();
      request.sector = request.cadastralKey.split('-')[0]
        ? parseInt(request.cadastralKey.split('-')[0])
        : 1;
      request.account = request.cadastralKey.split('-')[1]
        ? parseInt(request.cadastralKey.split('-')[1])
        : 1;

      const readingModel: ReadingModel =
        ReadingMapper.fromCreateReadingRequestToReadingModel(request);

      return this.readingsRepository.createReading(readingModel);
    } catch (error) {
      throw error;
    }
  }

  async findCurrentReading(
    params: FindCurrentReadingParams,
  ): Promise<ReadingResponse | null> {
    try {
      const validateParameters: string[] = [
        'sector',
        'account',
        'year',
        'month',
        'previousReading',
      ];

      const missingParametersMessages: string[] = validateFields(
        params,
        validateParameters,
      );
      if (missingParametersMessages.length > 0) {
        throw new Error(JSON.stringify(missingParametersMessages));
      }

      const result = await this.readingsRepository.findCurrentReading(params);
      if (!result) {
        return null;
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  async updateCurrentReading(
    params: FindCurrentReadingParams,
    request: UpdateReadingRequest,
  ): Promise<ReadingResponse> {
    try {
      console.log('Received updateCurrentReading request in Service:', request);
      const requiredFieldsToUpdate: string[] = [
        'currentReading',
        'novelty',
        'cadastralKey',
      ];

      const missingFieldsMessages: string[] = validateFields(
        request,
        requiredFieldsToUpdate,
      );
      if (missingFieldsMessages.length > 0) {
        throw new Error(JSON.stringify(missingFieldsMessages));
      }

      const requiredParamsToFind: string[] = [
        'sector',
        'account',
        'year',
        'month',
        'previousReading',
      ];

      const missingParamsMessages: string[] = validateFields(
        params,
        requiredParamsToFind,
      );
      if (missingParamsMessages.length > 0) {
        throw new Error(JSON.stringify(missingParamsMessages));
      }

      const existingReading =
        await this.readingsRepository.findCurrentReading(params);

      if (!existingReading) {
        throw new ReadingNotFoundException('Reading to update not found');
      }
      /*
      if (
        existingReading.readingDate !== null ||
        existingReading.readingTime !== null ||
        existingReading.currentReading !== null
      ) {
        console.log(
          'Checking: ',
          existingReading.readingDate,
          existingReading.readingTime,
          existingReading.currentReading,
        );
        throw new Error(
          'Reading has already been recorded and cannot be updated',
        );
      }
      */

      const updatedReadingModel: ReadingModel =
        ReadingMapper.fromUpdateReadingRequestToReadingModel(request);

      const updatedReading = await this.readingsRepository.updateCurrentReading(
        params,
        updatedReadingModel,
      );

      console.log(updatedReading);

      if (!updatedReading) {
        throw new Error('Failed to update the reading');
      }

      return updatedReading;
    } catch (error) {
      throw error;
    }
  }

  async calculateReadingValue(
    cadastralKey: string,
    consumptionM3: number,
  ): Promise<number> {
    try {
      const readingValue = await this.readingsRepository.calculateReadingValue(
        cadastralKey,
        consumptionM3,
      );
      return readingValue;
    } catch (error) {
      throw error;
    }
  }

  async findPendingReadingsByCadastralKey(
    cadastralKey: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      const pendingReadings =
        await this.readingsRepository.findPendingReadingsByCadastralKey(
          cadastralKey,
        );
      return this.enrichPendingReadingsWithExternalData(pendingReadings);
    } catch (error) {
      throw error;
    }
  }

  async findPendingReadingsByCardId(
    cardId: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      const pendingReadings =
        await this.readingsRepository.findPendingReadingsByCardId(cardId);
      return this.enrichPendingReadingsWithExternalData(pendingReadings);
    } catch (error) {
      throw error;
    }
  }

  async findPendingReadingsByCadastralKeyOrCardId(
    searchValue: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      // First, verify if there are any readings for the given search value (cadastral key or card ID)
      const verifyiFExists =
        await this.readingsRepository.verifyReadingExists(searchValue);
      if (!verifyiFExists) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No Exists any reading for the given search value: ${searchValue}`,
        });
      }

      const pendingReadings =
        await this.readingsRepository.findPendingReadingsByCadastralKeyOrCardId(
          searchValue,
        );
      return this.enrichPendingReadingsWithExternalData(pendingReadings);
    } catch (error) {
      throw error;
    }
  }

  private async enrichPendingReadingsWithExternalData(
    pendingReadings: PendingReadingResponse[],
  ): Promise<PendingReadingResponse[]> {
    if (!pendingReadings || pendingReadings.length === 0) {
      return pendingReadings;
    }

    try {
      const cardId = pendingReadings[0].cardId;
      if (!cardId) {
        return pendingReadings;
      }

      const externalPayrolls =
        await this.externalPayrollRepository.getPayrollsByIdentification(
          cardId,
        );

      if (!externalPayrolls || externalPayrolls.length === 0) {
        return pendingReadings;
      }

      return pendingReadings.map((reading) => {
        const match = externalPayrolls.find(
          (ep) =>
            String(ep.Mes).trim().toUpperCase() ===
              reading.month.trim().toUpperCase() &&
            Number(ep.Anio) === reading.year &&
            Number(ep.Consumo) === reading.consumption &&
            Number(ep.LecturaActual) === reading.currentReading,
        );

        if (match) {
          reading.thirdPartyValue = match.valor_terceros;
          reading.total =
            reading.epaaValue +
            reading.trashRateOfficial +
            reading.thirdPartyValue;
        }

        return reading;
      });
    } catch (error) {
      return pendingReadings;
    }
  }

  async verifyReadingExists(searchValue: string): Promise<boolean> {
    try {
      const exists =
        await this.readingsRepository.verifyReadingExists(searchValue);
      return exists;
    } catch (error) {
      throw error;
    }
  }

  async findAllPaymentByDateAndOrderValue(
    paymentDate: string,
    orderValue: number,
  ): Promise<PaymentResponse[]> {
    try {
      const payments =
        await this.readingsRepository.findAllPaymentByDateAndOrderValue(
          paymentDate,
          orderValue,
        );
      if (!payments || payments.length === 0) {
        return [];
      }
      return payments;
    } catch (error) {
      throw error;
    }
  }

  async findAllPaymentReadingPayrollsByDate(
    paymentDate: string,
  ): Promise<PaymentReadingResponse[]> {
    try {
      const payments =
        await this.readingsRepository.findAllPaymentReadingPayrollsByDate(
          paymentDate,
        );
      if (!payments || payments.length === 0) {
        return [];
      }
      return payments;
    } catch (error) {
      throw error;
    }
  }

  private async enrichPaymentReadingsWithExternalData(
    paymentReadings: PaymentReadingResponse[],
  ): Promise<PaymentReadingResponse[]> {
    if (!paymentReadings || paymentReadings.length === 0) {
      return paymentReadings;
    }

    try {
      // Build a map of externalPayrolls per unique cardId
      const uniqueCardIds = [
        ...new Set(paymentReadings.map((r) => r.cardId).filter(Boolean)),
      ];
      const payrollsMap = new Map<string, any[]>();

      for (const cardId of uniqueCardIds) {
        const payrolls =
          await this.externalPayrollRepository.getPayrollsByIdentification(
            cardId,
          );
        if (payrolls && payrolls.length > 0) {
          payrollsMap.set(cardId, payrolls);
        }
      }

      if (payrollsMap.size === 0) {
        return paymentReadings;
      }

      return paymentReadings.map((reading) => {
        const externalPayrolls = payrollsMap.get(reading.cardId);
        if (!externalPayrolls) return reading;

        const match = externalPayrolls.find(
          (ep) =>
            String(ep.Mes).trim().toUpperCase() ===
              reading.month.trim().toUpperCase() &&
            Number(ep.Anio) === reading.year &&
            Number(ep.Consumo) === reading.consumption &&
            Number(ep.LecturaActual) === reading.currentReading,
        );

        if (!match) return reading;

        const thirdPartyValue = match.valor_terceros;
        return {
          ...reading,
          thirdPartyValue,
          total: reading.epaaValue + reading.trashRate + thirdPartyValue,
        };
      });
    } catch (error) {
      return paymentReadings;
    }
  }

  private async enrichPaymentsWithExternalData(
    payments: PaymentResponse[],
  ): Promise<PaymentResponse[]> {
    if (!payments || payments.length === 0) {
      return payments;
    }

    try {
      // Build a map of externalPayrolls per unique cardId
      const uniqueCardIds = [
        ...new Set(payments.map((p) => p.cardId).filter(Boolean)),
      ];
      const payrollsMap = new Map<string, any[]>();

      for (const cardId of uniqueCardIds) {
        const payrolls =
          await this.externalPayrollRepository.getPayrollsByIdentification(
            cardId,
          );
        if (payrolls && payrolls.length > 0) {
          payrollsMap.set(cardId, payrolls);
        }
      }

      if (payrollsMap.size === 0) {
        return payments;
      }

      return payments.map((payment) => {
        const externalPayrolls = payrollsMap.get(payment.cardId);
        if (!externalPayrolls) return payment;

        const match = externalPayrolls.find(
          (ep) => Number(ep.Cod_Ingreso) === Number(payment.incomeCode),
        );

        if (!match) return payment;

        const thirdPartyValue = match.valor_terceros;
        return {
          ...payment,
          thirdPartyValue,
          total: payment.titleValue + payment.trashRate + thirdPartyValue,
        };
      });
    } catch (error) {
      return payments;
    }
  }

  async findAllPaymentByDate(paymentDate: string): Promise<PaymentResponse[]> {
    try {
      const payments =
        await this.readingsRepository.findAllPaymentByDate(paymentDate);
      if (!payments || payments.length === 0) {
        return [];
      }
      return payments;
    } catch (error) {
      throw error;
    }
  }

  async findAllPaymentByInitDateAndEndDate(
    initDate: string,
    endDate: string,
    limit?: number,
    offset?: number,
  ): Promise<PaymentResponse[]> {
    try {
      const payments =
        await this.readingsRepository.findAllPaymentByInitDateAndEndDate(
          initDate,
          endDate,
          limit,
          offset,
        );
      if (!payments || payments.length === 0) {
        return [];
      }
      return payments;
    } catch (error) {
      throw error;
    }
  }

  async getDailyGroupedReport(
    params: DateRangeParams,
  ): Promise<DailyGroupedReport[]> {
    try {
      const result =
        await this.entryDataRepository.getDailyGroupedReport(params);
      if (!result || result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Daily grouped report not found for the given parameters: ${JSON.stringify(params)}`,
        });
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getDailyCollectorSummary(
    params: DateRangeParams,
  ): Promise<DailyCollectorSummary[]> {
    try {
      const result =
        await this.entryDataRepository.getDailyCollectorSummary(params);
      if (!result || result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Daily collector summary not found for the given parameters: ${JSON.stringify(params)}`,
        });
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getDailyPaymentMethodReport(
    params: DateRangeParams,
  ): Promise<DailyPaymentMethodReport[]> {
    try {
      const result =
        await this.entryDataRepository.getDailyPaymentMethodReport(params);
      if (!result || result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Daily payment method report not found for the given parameters: ${JSON.stringify(params)}`,
        });
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getFullBreakdownReport(
    params: DateRangeParams,
  ): Promise<FullBreakdownReport[]> {
    try {
      const result =
        await this.entryDataRepository.getFullBreakdownReport(params);
      if (!result || result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Full breakdown report not found for the given parameters: ${JSON.stringify(params)}`,
        });
      }
      return result;
    } catch (error) {
      throw error;
    }
  }
}
