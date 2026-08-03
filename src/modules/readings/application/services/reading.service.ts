import { Inject, Injectable } from '@nestjs/common';
import { InterfaceReadingUseCase } from '../usecases/reading.use-case.interface';
import { CreateReadingLegacyRequest } from '../../domain/schemas/dto/request/create.reading.request';
import { ReadingResponse } from '../../domain/schemas/dto/response/readings.response';
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
import { Logger } from 'winston';

@Injectable()
export class ReadingService implements InterfaceReadingUseCase {
  constructor(
    @Inject('ReadingsRepository')
    private readonly readingsRepository: InterfaceReadingsRepository,
  ) {}

  async createReading(
    request: CreateReadingLegacyRequest,
  ): Promise<ReadingResponse> {
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

      const changeNovelty: string | null = this.changeNovelty(request.novelty);
      request.novelty = changeNovelty;

      const valueConsumoAgua = await this.calculateReadingValue(
        request.cadastralKey,
        Number(request.currentReading) - Number(request.previousReading),
      );

      request.readingValueCalculated = valueConsumoAgua;

      const sewerRateValue = this.CalculateSewerRate(valueConsumoAgua);
      request.sewerRate = sewerRateValue;

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
      const sectorVal = request.cadastralKey.split('-')[0]
        ? parseInt(request.cadastralKey.split('-')[0])
        : 1;
      const accountVal = request.cadastralKey.split('-')[1]
        ? parseInt(request.cadastralKey.split('-')[1])
        : 1;
      request.sector = sectorVal;
      request.account = accountVal;

      const existingReading = await this.readingsRepository.findCurrentReading({
        sector: sectorVal,
        account: accountVal,
        year: request.year,
        month: request.month,
        readingId: request.readingId!,
      });
      if (existingReading) {
        // En lugar de fallar o duplicar, retornamos exitosamente la lectura previa
        console.warn(
          `[Idempotency Check] Reading already exists for Sector ${sectorVal}, Account ${accountVal} in ${request.month}/${request.year}. Skipping duplicate insert.`,
        );
        return existingReading;
      }

      const readingModel: ReadingModel =
        ReadingMapper.fromCreateReadingRequestToReadingModel(request);

      return this.readingsRepository.createReading(readingModel);
    } catch (error) {
      throw error;
    }
  }

  private CalculateSewerRate(readingValue: number): number {
    return readingValue * (40 / 100); // 40% of the reading value
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
        'readingId',
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
      //console.log('Received updateCurrentReading request in Service:', request);
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
        'readingId',
      ];

      const missingParamsMessages: string[] = validateFields(
        params,
        requiredParamsToFind,
      );
      if (missingParamsMessages.length > 0) {
        throw new Error(JSON.stringify(missingParamsMessages));
      }

      console.log(
        `Searching for existing reading with params: ${JSON.stringify(params)}`,
      );

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

      const changeNovelty: string | null = this.changeNovelty(request.novelty);
      request.novelty = changeNovelty;
      const valueConsumoAgua = await this.calculateReadingValue(
        request.cadastralKey,
        Number(request.currentReading) - Number(request.previousReading),
      );

      request.readingValueCalculated = valueConsumoAgua;
      const sewerRateValue = this.CalculateSewerRate(valueConsumoAgua);
      request.sewerRate = sewerRateValue;

      const updatedReadingModel: ReadingModel =
        ReadingMapper.fromUpdateReadingRequestToReadingModel(request);

      const updatedReading = await this.readingsRepository.updateCurrentReading(
        params,
        updatedReadingModel,
      );

      //console.log(updatedReading);

      if (!updatedReading) {
        throw new Error('Failed to update the reading');
      }

      return updatedReading;
    } catch (error) {
      throw error;
    }
  }

  private changeNovelty(novelty: string | null): string | null {
    if (!novelty) {
      return null;
    }
    const noveltyUpper = novelty.toUpperCase();
    if (
      noveltyUpper.includes('CONSUMO MUY BAJO') ||
      noveltyUpper.includes('ALERTA CONSUMO BAJO')
    ) {
      return 'NORMAL';
    }
    if (
      noveltyUpper.includes('CONSUMO MUY ALTO') ||
      noveltyUpper.includes('ALERTA CONSUMO ALTO')
    ) {
      return 'CONSUMO ALTO';
    }
    if (noveltyUpper.includes('LECTURA INICIAL')) {
      return 'NUEVO';
    }

    if (noveltyUpper.includes('LECTURA INVÁLIDA')) {
      return 'LECTURA INVALIDA';
    }

    return novelty;
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
}
