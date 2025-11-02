import { Inject, Injectable } from "@nestjs/common";
import { InterfaceReadingUseCase } from "../usecases/reading.use-case.interface";
import { CreateReadingLegacyRequest } from "../../domain/schemas/dto/request/create.reading.request";
import { ReadingResponse } from "../../domain/schemas/dto/response/readings.response";
import { InterfaceReadingsRepository } from "../../domain/contracts/readings.interface.repository";
import { ReadingModel } from "../../domain/schemas/model/sqlserver/reading.model";
import { ReadingMapper } from "../mappers/readings.mapper";
import { RpcException } from "@nestjs/microservices/exceptions/rpc-exception";
import { validateFields } from "../../../../shared/validators/fields.validators";
import { statusCode } from "../../../../settings/environments/status-code";
import { MONTHS } from "../../../../shared/consts/months";

@Injectable()
export class ReadingService implements InterfaceReadingUseCase {

  constructor(
    @Inject('ReadingsRepository')
    private readonly readingsRepository: InterfaceReadingsRepository
  ) { }

  createReading(request: CreateReadingLegacyRequest): Promise<ReadingResponse> {
    try {

      const requiredFields: string[] = [
        'previousReading',
        'currentReading',
        'cadastralKey',
        'novelty'
      ];

      const missingFieldsMessages: string[] = validateFields(request, requiredFields);
      if (missingFieldsMessages.length > 0) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: missingFieldsMessages
        });
      }

      const now: Date = new Date();
      const hour: string = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Guayaquil'
      }).format(now);
      request.readingTime = hour;
      request.readingDate = now;
      request.readingTime = hour;
      request.month = MONTHS[now.getMonth() + 1];
      request.year = now.getFullYear();
      request.sector = request.cadastralKey.split('-')[0] ? parseInt(request.cadastralKey.split('-')[0]) : 1;
      request.account = request.cadastralKey.split('-')[1] ? parseInt(request.cadastralKey.split('-')[1]) : 1;

      const readingModel: ReadingModel = ReadingMapper.fromCreateReadingRequestToReadingModel(request);

      return this.readingsRepository.createReading(readingModel);
    } catch (error) {
      throw error;
    }
  }
}