import { Inject, Injectable } from '@nestjs/common';
import { InterfaceAccountingUseCase } from '../usecases/accounting.use-case.interface';
import { InterfaceEntryDataUseCase } from '../usecases/entry-data.use-case.interface';
import {
  MonthlyDebtSummaryResponse,
  OverduePaymentResponse,
  OverdueSummaryResponse,
  PaymentReadingResponse,
  PaymentResponse,
  PendingReadingResponse,
  YearlyOverdueSummaryResponse,
} from '../../domain/schemas/dto/response/accounting.response';
import {
  AgreementInstallmentResponse,
  AgreementKPIsCustomerResponse,
  AgreementKPIsResponse,
  CitizenSummary,
  CollectorPerformance,
  Debtor,
  MonthlyCollectionSummary,
  PaymentMethodSummary,
} from '../../domain/schemas/dto/response/agreements.response';
import { InterfaceAccountingRepository } from '../../domain/contracts/accounting.interface.repository';
import { InterfaceExternalPayrollRepository } from '../../domain/contracts/external-payroll.interface.repository';
import { InterfaceEntryDataRepository } from '../../domain/contracts/entry-data.interface.repository';
import {
  DailyCollectorSummary,
  DailyGroupedReport,
  DailyPaymentMethodReport,
  DateRangeParams,
  FullBreakdownReport,
} from '../../domain/schemas/dto/response/entry-data.response';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../settings/environments/status-code';
import { InterfaceGeneralCollectionUseCase } from '../usecases/general-collection.use-case.interface';
import { InterfaceGeneralCollectionRepository } from '../../domain/contracts/general-collection.interface.repository';
import {
  GeneralCollectionsParams,
  GeneralTrendCollectionsParams,
} from '../../domain/schemas/dto/request/general-collection.params';
import {
  GeneralCollectionResponse,
  GeneralDailyGroupedReportResponse,
  GeneralYearlyGroupedReportResponse,
  GeneralMonthlyGroupedReportResponse,
  GeneralYearlyKPIResponse,
  GeneralMonthlyKPIResponse,
  GeneralKPIResponse,
} from '../../domain/schemas/dto/response/general-collection.response';
import { InterfaceAgreementsRepository } from '../../domain/contracts/agreements.interface.repository';
import { InterfaceAgreementsUseCase } from '../usecases/agreements.use-case.interface';
import {
  AgreementsCustomerParams,
  AgreementsParams,
} from '../../domain/schemas/dto/request/agreements.params';

@Injectable()
export class AccountingService
  implements
    InterfaceAccountingUseCase,
    InterfaceEntryDataUseCase,
    InterfaceGeneralCollectionUseCase,
    InterfaceAgreementsUseCase
{
  constructor(
    @Inject('AccountingRepository')
    private readonly accountingRepository: InterfaceAccountingRepository,
    @Inject('ExternalPayrollRepository')
    private readonly externalPayrollRepository: InterfaceExternalPayrollRepository,
    @Inject('EntryDataRepository')
    private readonly entryDataRepository: InterfaceEntryDataRepository,
    @Inject('GeneralCollectionRepository')
    private readonly generalCollectionRepository: InterfaceGeneralCollectionRepository,
    @Inject('AgreementsRepository')
    private readonly agreementsRepository: InterfaceAgreementsRepository,
  ) {}

  async findAllPaymentByDateAndOrderValue(
    paymentDate: string,
    orderValue: number,
  ): Promise<PaymentResponse[]> {
    try {
      const payments =
        await this.accountingRepository.findAllPaymentByDateAndOrderValue(
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
        await this.accountingRepository.findAllPaymentReadingPayrollsByDate(
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

  async findAllPaymentByInitDateAndEndDate(
    initDate: string,
    endDate: string,
    limit?: number,
    offset?: number,
  ): Promise<PaymentResponse[]> {
    try {
      const payments =
        await this.accountingRepository.findAllPaymentByInitDateAndEndDate(
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
        return [];
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
        return [];
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
        return [];
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
        return [];
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  async findAllOverduePayments(
    limit?: number,
    offset?: number,
  ): Promise<OverduePaymentResponse[]> {
    try {
      const overdueReadings =
        await this.accountingRepository.findAllOverduePayments(limit, offset);
      if (!overdueReadings || overdueReadings.length === 0) {
        return [];
      }
      return overdueReadings;
    } catch (error) {
      throw error;
    }
  }

  async findOverdueSummary(): Promise<OverdueSummaryResponse | null> {
    try {
      const summary = await this.accountingRepository.findOverdueSummary();
      if (!summary) {
        return null; // Return null instead of throwing for summary
      }
      return summary;
    } catch (error) {
      throw error;
    }
  }

  async findYearlyOverdueSummary(): Promise<YearlyOverdueSummaryResponse[]> {
    try {
      const summary =
        await this.accountingRepository.findYearlyOverdueSummary();
      if (!summary) {
        return [];
      }
      return summary;
    } catch (error) {
      throw error;
    }
  }

  async findMonthlyDebtSummary(): Promise<MonthlyDebtSummaryResponse[]> {
    try {
      const summary: MonthlyDebtSummaryResponse[] =
        await this.accountingRepository.findMonthlyDebtSummary();
      if (!summary) {
        return [];
      }
      return summary;
    } catch (error) {
      throw error;
    }
  }

  async findPendingReadingsByCadastralKey(
    cadastralKey: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      const pendingReadings =
        await this.accountingRepository.findPendingReadingsByCadastralKey(
          cadastralKey,
        );
      return this.enrichPendingReadingsWithExternalData(pendingReadings);
      //return pendingReadings;
    } catch (error) {
      throw error;
    }
  }

  async findPendingReadingsByCardId(
    cardId: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      const pendingReadings =
        await this.accountingRepository.findPendingReadingsByCardId(cardId);
      return this.enrichPendingReadingsWithExternalData(pendingReadings);
    } catch (error) {
      throw error;
    }
  }

  async findPendingReadingsByCadastralKeyOrCardId(
    searchValue: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      const verifyiFExists =
        await this.accountingRepository.verifyReadingExists(searchValue);
      if (!verifyiFExists) {
        return [];
      }

      const pendingReadings =
        await this.accountingRepository.findPendingReadingsByCadastralKeyOrCardId(
          searchValue,
        );
      return this.enrichPendingReadingsWithExternalData(pendingReadings);
    } catch (error) {
      throw error;
    }
  }

  async findPendingReadingsByCadastralKeyOrCardIdAll(
    searchValue: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      const pendingReadings =
        await this.accountingRepository.findPendingReadingsByCadastralKeyOrCardIdAll(
          searchValue,
        );

      if (!pendingReadings || pendingReadings.length === 0) {
        return [];
      }

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
          reading.thirdPartyValue = match.valor_terceros + 4.36;
          reading.total = reading.total + match.valor_terceros;
          reading.adjustedTotal = reading.adjustedTotal + match.valor_terceros;
        }

        return reading;
      });
    } catch (error) {
      return pendingReadings;
    }
  }

  private async enrichPaymentReadingsWithExternalData(
    paymentReadings: PaymentReadingResponse[],
  ): Promise<PaymentReadingResponse[]> {
    if (!paymentReadings || paymentReadings.length === 0) {
      return paymentReadings;
    }

    try {
      const uniqueCardIds = [
        ...new Set(paymentReadings.map((r) => r.cardId).filter(Boolean)),
      ];
      const payrollsMap = new Map<string, any[]>();

      const payrollPromises = uniqueCardIds.map(async (cardId) => {
        const payrolls =
          await this.externalPayrollRepository.getPayrollsByIdentification(
            cardId,
          );
        if (payrolls && payrolls.length > 0) {
          payrollsMap.set(cardId, payrolls);
        }
      });
      await Promise.all(payrollPromises);

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
      const uniqueCardIds = [
        ...new Set(payments.map((p) => p.cardId).filter(Boolean)),
      ];
      const payrollsMap = new Map<string, any[]>();

      const payrollPromises = uniqueCardIds.map(async (cardId) => {
        const payrolls =
          await this.externalPayrollRepository.getPayrollsByIdentification(
            cardId,
          );
        if (payrolls && payrolls.length > 0) {
          payrollsMap.set(cardId, payrolls);
        }
      });
      await Promise.all(payrollPromises);

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

  async verifyReadingExists(searchValue: string): Promise<boolean> {
    try {
      const exists =
        await this.accountingRepository.verifyReadingExists(searchValue);
      return exists;
    } catch (error) {
      throw error;
    }
  }

  async getGeneralCollectionKPI(
    params: GeneralCollectionsParams,
  ): Promise<GeneralKPIResponse | null> {
    try {
      const kpi =
        await this.generalCollectionRepository.getGeneralCollectionKPI(params);
      return kpi;
    } catch (error) {
      throw error;
    }
  }

  async getGeneralCollectionReport(
    params: GeneralCollectionsParams,
  ): Promise<GeneralCollectionResponse[]> {
    try {
      const report =
        await this.generalCollectionRepository.getGeneralCollectionReport(
          params,
        );
      return report;
    } catch (error) {
      throw error;
    }
  }

  async getGeneralDailyCollectionGroupedReport(
    params: GeneralCollectionsParams,
  ): Promise<GeneralDailyGroupedReportResponse[]> {
    try {
      const report =
        await this.generalCollectionRepository.getGeneralDailyCollectionGroupedReport(
          params,
        );
      return report;
    } catch (error) {
      throw error;
    }
  }

  async getGeneralYearlyCollectionGroupedReport(
    params: GeneralTrendCollectionsParams,
  ): Promise<GeneralYearlyGroupedReportResponse[]> {
    try {
      return await this.generalCollectionRepository.getGeneralYearlyCollectionGroupedReport(
        params,
      );
    } catch (error) {
      throw error;
    }
  }

  async getGeneralMonthlyCollectionGroupedReport(
    params: GeneralTrendCollectionsParams,
  ): Promise<GeneralMonthlyGroupedReportResponse[]> {
    try {
      return await this.generalCollectionRepository.getGeneralMonthlyCollectionGroupedReport(
        params,
      );
    } catch (error) {
      throw error;
    }
  }

  async getGeneralYearlyCollectionKPI(
    params: GeneralTrendCollectionsParams,
  ): Promise<GeneralYearlyKPIResponse[]> {
    try {
      return await this.generalCollectionRepository.getGeneralYearlyCollectionKPI(
        params,
      );
    } catch (error) {
      throw error;
    }
  }

  async getGeneralMonthlyCollectionKPI(
    params: GeneralTrendCollectionsParams,
  ): Promise<GeneralMonthlyKPIResponse[]> {
    try {
      return await this.generalCollectionRepository.getGeneralMonthlyCollectionKPI(
        params,
      );
    } catch (error) {
      throw error;
    }
  }

  async getAgreementsKpi(
    params: AgreementsParams,
  ): Promise<AgreementKPIsResponse[]> {
    try {
      return await this.agreementsRepository.getAgreementsKpi(params);
    } catch (error) {
      throw error;
    }
  }

  async getAgreementsKpiCustomer(
    cardId: string,
    params: AgreementsCustomerParams,
  ): Promise<AgreementKPIsCustomerResponse[]> {
    try {
      return await this.agreementsRepository.getAgreementsKpiCustomer(
        cardId,
        params,
      );
    } catch (error) {
      throw error;
    }
  }

  async getAgreementInstallmentDetails(
    cardId: string,
    params: DateRangeParams,
  ): Promise<AgreementInstallmentResponse[]> {
    try {
      return await this.agreementsRepository.getAgreementInstallmentDetails(
        cardId,
        params,
      );
    } catch (error) {
      throw error;
    }
  }

  async getMonthlyCollectionSummary(
    monthsBack: number,
  ): Promise<MonthlyCollectionSummary[]> {
    try {
      return await this.agreementsRepository.getMonthlyCollectionSummary(
        monthsBack,
      );
    } catch (error) {
      throw error;
    }
  }

  async getDebtorsWithRisk(): Promise<Debtor[]> {
    try {
      return await this.agreementsRepository.getDebtorsWithRisk();
    } catch (error) {
      throw error;
    }
  }

  async getCollectorPerformance(
    params: DateRangeParams,
  ): Promise<CollectorPerformance[]> {
    try {
      return await this.agreementsRepository.getCollectorPerformance(params);
    } catch (error) {
      throw error;
    }
  }

  async getPaymentMethodSummary(
    params: DateRangeParams,
  ): Promise<PaymentMethodSummary[]> {
    try {
      return await this.agreementsRepository.getPaymentMethodSummary(params);
    } catch (error) {
      throw error;
    }
  }

  async getCitizenSummary(params: DateRangeParams): Promise<CitizenSummary[]> {
    try {
      return await this.agreementsRepository.getCitizenSummary(params);
    } catch (error) {
      throw error;
    }
  }
}
