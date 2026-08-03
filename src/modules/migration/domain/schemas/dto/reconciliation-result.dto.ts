import {
  ReconciliationMismatchStatus,
  ReconciliationRecordSource,
} from '../../contracts/lecturas-reconciliation.repository';

export class ReconciliationSummaryDto {
  constructor(
    public readonly totalPostgres: number,
    public readonly totalApLecturas: number,
    public readonly matched: number,
    public readonly mismatched: number,
    public readonly missingInApLecturas: number,
  ) {}
}

export class ReconciliationDuplicateDto {
  constructor(
    public readonly source: ReconciliationRecordSource,
    public readonly identifier: string | null,
    public readonly anio: string | null,
    public readonly mes: string | null,
    public readonly occurrences: number,
  ) {}
}

export class ReconciliationMismatchDto {
  constructor(
    public readonly acometidaId: string | null,
    public readonly mesLectura: string | null,
    public readonly claveCatastral: string | null,
    public readonly postgresLecturaAnterior: number | null,
    public readonly legacyLecturaAnterior: number | null,
    public readonly postgresLecturaActual: number | null,
    public readonly legacyLecturaActual: number | null,
    public readonly status: ReconciliationMismatchStatus,
  ) {}
}
