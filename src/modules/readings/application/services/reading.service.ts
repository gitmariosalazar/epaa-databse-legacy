import { Inject, Injectable } from '@nestjs/common';
import { InterfaceReadingUseCase } from '../usecases/reading.use-case.interface';
import { CreateReadingLegacyRequest } from '../../domain/schemas/dto/request/create.reading.request';
import { ReadingResponse } from '../../domain/schemas/dto/response/readings.response';
import { InterfaceReadingsRepository } from '../../domain/contracts/readings.interface.repository';
import { ReadingModel } from '../../domain/schemas/model/sqlserver/reading.model';
import { ReadingMapper } from '../mappers/readings.mapper';
import { RpcException } from '@nestjs/microservices/exceptions/rpc-exception';
import { validateFields } from '../../../../shared/validators/fields.validators';
import { statusCode } from '../../../../settings/environments/status-code';
import { MONTHS } from '../../../../shared/consts/months';
import { FindCurrentReadingParams } from '../../domain/schemas/dto/request/find-current-reading.paramss';
import { UpdateReadingRequest } from '../../domain/schemas/dto/request/update.reading.request';

@Injectable()
export class ReadingService implements InterfaceReadingUseCase {
  constructor(
    @Inject('ReadingsRepository')
    private readonly readingsRepository: InterfaceReadingsRepository,
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
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: missingFieldsMessages,
        });
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
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: missingParametersMessages,
        });
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
      const requiredFieldsToUpdate: string[] = [
        'currentReading',
        'novelty',
        'readingDate',
        'readingTime',
        'cadastralKey',
      ];

      const missingFieldsMessages: string[] = validateFields(
        request,
        requiredFieldsToUpdate,
      );
      if (missingFieldsMessages.length > 0) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: missingFieldsMessages,
        });
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
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: missingParamsMessages,
        });
      }

      const existingReading =
        await this.readingsRepository.findCurrentReading(params);
      console.log('Reading to update:', existingReading);

      if (!existingReading) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'Reading to update not found',
        });
      }

      if (
        existingReading.readingDate !== null ||
        existingReading.readingTime !== null ||
        existingReading.currentReading !== null
      ) {
        console.log('Checking: ', existingReading.readingDate, 
          existingReading.readingTime, existingReading.currentReading)
        throw new RpcException({
          statusCode: statusCode.CONFLICT,
          message: 'Reading has already been recorded and cannot be updated',
        });
      }

      const updatedReadingModel: ReadingModel =
        ReadingMapper.fromUpdateReadingRequestToReadingModel(request);

      const updatedReading = await this.readingsRepository.updateCurrentReading(
        params,
        updatedReadingModel,
      );

      console.log(updatedReading);

      if (!updatedReading) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to update the reading',
        });
      }

      return updatedReading;
    } catch (error) {
      throw error;
    }
  }
}
