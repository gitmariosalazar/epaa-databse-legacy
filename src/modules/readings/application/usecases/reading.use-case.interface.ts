import { CreateReadingLegacyRequest } from '../../domain/schemas/dto/request/create.reading.request';
import { FindCurrentReadingParams } from '../../domain/schemas/dto/request/find-current-reading.paramss';
import { UpdateReadingRequest } from '../../domain/schemas/dto/request/update.reading.request';
import {
  PendingReadingResponse,
  ReadingResponse,
} from '../../domain/schemas/dto/response/readings.response';

export interface InterfaceReadingUseCase {
  createReading(request: CreateReadingLegacyRequest): Promise<ReadingResponse>;
  findCurrentReading(
    params: FindCurrentReadingParams,
  ): Promise<ReadingResponse | null>;
  updateCurrentReading(
    params: FindCurrentReadingParams,
    request: UpdateReadingRequest,
  ): Promise<ReadingResponse>;
  //updateReading(id: string, request: UpdateReadingRequest): Promise<ReadingResponse>;
  //deleteReading(id: string): Promise<void>;
  //getReadingById(id: string): Promise<ReadingResponse>;
  //getAllReadings(): Promise<ReadingResponse[]>;
  calculateReadingValue(
    cadastralKey: string,
    consumptionM3: number,
  ): Promise<number>;
  findPendingReadingsByCadastralKey(
    cadastralKey: string,
  ): Promise<PendingReadingResponse[]>;
  findPendingReadingsByCardId(
    cardId: string,
  ): Promise<PendingReadingResponse[]>;
  findPendingReadingsByCadastralKeyOrCardId(
    searchValue: string,
  ): Promise<PendingReadingResponse[]>;
  verifyReadingExists(searchValue: string): Promise<boolean>;
}
