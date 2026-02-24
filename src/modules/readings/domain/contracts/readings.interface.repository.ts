import { FindCurrentReadingParams } from '../schemas/dto/request/find-current-reading.paramss';
import {
  PendingReadingResponse,
  ReadingResponse,
} from '../schemas/dto/response/readings.response';
import { ReadingModel } from '../schemas/model/sqlserver/reading.model';

export interface InterfaceReadingsRepository {
  createReading(reading: ReadingModel): Promise<ReadingResponse>;
  findCurrentReading(
    params: FindCurrentReadingParams,
  ): Promise<ReadingResponse | null>;
  updateCurrentReading(
    params: FindCurrentReadingParams,
    reading: ReadingModel,
  ): Promise<ReadingResponse>;
  //updateReading(id: string, reading: ReadingModel): Promise<ReadingResponse>;
  //deleteReading(id: string): Promise<void>
  //getReadingById(id: string): Promise<ReadingResponse>
  //getAllReadings(): Promise<ReadingResponse[]>
  calculateReadingValue(
    cadastralKey: string,
    consumptionM3: number,
  ): Promise<number>;
  // Consultar Planillas Pendientes
  findPendingReadingsByCadastralKey(
    cadastralKey: string,
  ): Promise<PendingReadingResponse[]>;

  // Consultar Planillas Pendientes
  findPendingReadingsByCardId(
    cardId: string,
  ): Promise<PendingReadingResponse[]>;

  // Consultar Planillas Pendientes
  findPendingReadingsByCadastralKeyOrCardId(
    searchValue: string,
  ): Promise<PendingReadingResponse[]>;

  // VErify if the reading exists for a given cadastral key and date
  verifyReadingExists(searchValue: string): Promise<boolean>;
}
