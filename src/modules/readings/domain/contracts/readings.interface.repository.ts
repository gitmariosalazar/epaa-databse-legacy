import { ReadingResponse } from "../schemas/dto/response/readings.response"
import { ReadingModel } from "../schemas/model/sqlserver/reading.model"

export interface InterfaceReadingsRepository {
  createReading(reading: ReadingModel): Promise<ReadingResponse>
  //updateReading(id: string, reading: ReadingModel): Promise<ReadingResponse>;
  //deleteReading(id: string): Promise<void>
  //getReadingById(id: string): Promise<ReadingResponse>
  //getAllReadings(): Promise<ReadingResponse[]>
}