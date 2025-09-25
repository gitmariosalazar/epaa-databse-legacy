import { CreateReadingLegacyRequest } from "../../domain/schemas/dto/request/create.reading.request";
import { UpdateReadingRequest } from "../../domain/schemas/dto/request/update.reading.request";
import { ReadingResponse } from "../../domain/schemas/dto/response/readings.response";

export interface InterfaceReadingUseCase {
  createReading(request: CreateReadingLegacyRequest): Promise<ReadingResponse>;
  //updateReading(id: string, request: UpdateReadingRequest): Promise<ReadingResponse>;
  //deleteReading(id: string): Promise<void>;
  //getReadingById(id: string): Promise<ReadingResponse>;
  //getAllReadings(): Promise<ReadingResponse[]>;
}