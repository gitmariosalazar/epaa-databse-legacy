import { LecturaRecord } from './lecturas-source.repository';

export const LECTURAS_TARGET_REPOSITORY = Symbol('LECTURAS_TARGET_REPOSITORY');

export interface LecturasTargetRepository {
  recreateTable(): Promise<void>;
  bulkInsert(records: LecturaRecord[], batchSize: number): Promise<number>;
  findAll(): Promise<LecturaRecord[]>;
}
