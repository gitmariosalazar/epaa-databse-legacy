import { CreateReadingLegacyRequest } from "../../domain/schemas/dto/request/create.reading.request";
import { ReadingModel } from "../../domain/schemas/model/sqlserver/reading.model";

export class ReadingMapper {
  static fromCreateReadingRequestToReadingModel(request: CreateReadingLegacyRequest): ReadingModel {
    return new ReadingModel(
      request.sector,
      request.account,
      request.year,
      request.month,
      request.previousReading,
      request.currentReading,
      request.rentalIncomeCode,
      request.novelty,
      request.readingValue,
      request.sewerRate,
      request.reconnection,
      //request.incomeCode,
      request.readingDate,
      request.readingTime,
      request.cadastralKey
    );
  }
}