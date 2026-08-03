/** Period a reconciliation query is scoped to. `anio`/`mesTexto` match `AP_LECTURAS` columns, `mesLectura` matches `lecturas_postgres.mes_lectura` ('YYYY-MM'). */
export interface ReconciliationPeriod {
  anio: string;
  mesTexto: string;
  mesLectura: string;
}

export interface ReconciliationSummary {
  totalPostgres: number;
  totalApLecturas: number;
  matched: number;
  mismatched: number;
  missingInApLecturas: number;
}

export type ReconciliationRecordSource = 'AP_LECTURAS' | 'LECTURAS_POSTGRES';

export interface DuplicateReconciliationRecord {
  source: ReconciliationRecordSource;
  identifier: string | null;
  anio: string | null;
  mes: string | null;
  occurrences: number;
}

export type ReconciliationMismatchStatus = 'DIFERENTE' | 'SOLO_EN_POSTGRES';

export interface ReconciliationMismatchRecord {
  acometidaId: string | null;
  mesLectura: string | null;
  claveCatastral: string | null;
  postgresLecturaAnterior: number | null;
  legacyLecturaAnterior: number | null;
  postgresLecturaActual: number | null;
  legacyLecturaActual: number | null;
  status: ReconciliationMismatchStatus;
}

export const LECTURAS_RECONCILIATION_REPOSITORY = Symbol(
  'LECTURAS_RECONCILIATION_REPOSITORY',
);

/**
 * Compares `AP_LECTURAS` (legacy production table) directly against
 * `lecturas_postgres` (migration staging table), both living in the same
 * SQL Server instance. Unlike `LecturasSourceRepository`/`LecturasTargetRepository`
 * (which compare PostgreSQL vs SQL Server in-memory), this runs native T-SQL
 * joins since both tables share the same engine.
 */
export interface LecturasReconciliationRepository {
  getSummary(period: ReconciliationPeriod): Promise<ReconciliationSummary>;
  getDuplicates(
    period: ReconciliationPeriod,
  ): Promise<DuplicateReconciliationRecord[]>;
  getMismatches(
    period: ReconciliationPeriod,
  ): Promise<ReconciliationMismatchRecord[]>;
}
