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

// ============================================================================
// 1. ENUMS Y TIPOS LITERALES COMPARTIDOS
// ============================================================================

export type AuditoriaFiltroType =
  | 'TODOS'
  | 'DUPLICADOS'
  | 'DIFERENTES'
  | 'SOLO_POSTGRES';

export type AuditoriaDetalleStatus =
  | 'SOLO_EN_POSTGRES'
  | 'DUPLICADO_EN_SQL_SERVER'
  | 'DIFERENTE'
  | 'OK';

// ============================================================================
// 2. CONTEXTO DE RESUMEN (MÉTRICAS / KPIS)
// ============================================================================

/** Parámetros para solicitar únicamente el resumen de métricas */

/** Modelo de datos que devuelve la consulta de KPIs */
export interface LecturaAuditoriaResumen {
  total_cuentas_revisadas: number;
  total_conciliados_ok: number;
  total_lecturas_discrepantes: number;
  total_con_duplicados: number;
  cuentas_duplicadas_en_origen: number;
  cuentas_duplicadas_en_ap_lecturas: number;
  total_pendientes_migrar: number;
  total_huerfanas_en_ap: number;
  porcentaje_sincronizacion: number;
}

/** Respuesta estándar del endpoint de resumen */
export interface ResumenAuditoriaResponse {
  periodo: ReconciliationPeriod;
  data: LecturaAuditoriaResumen;
}

// ============================================================================
// 3. CONTEXTO DE DETALLE (TABLA / GRILLA FILTRABLE)
// ============================================================================

/** Parámetros para solicitar el listado detallado de registros */
export interface ConsultarDetalleAuditoriaParams {
  periodo: ReconciliationPeriod; // Ej: '2026-08'
  tipo_filtro: AuditoriaFiltroType; // 'TODOS' | 'DUPLICADOS' | 'DIFERENTES' | 'SOLO_POSTGRES'
}

/** Fila individual del reporte de auditoría */
export interface LecturaAuditoriaDetalleItem {
  acometida_id: string;
  mes_lectura: string;
  pg_lectura_anterior: number;
  ap_lectura_anterior: number | null;
  pg_lectura_actual: number;
  ap_lectura_actual: number | null;
  total_en_sql_server: number;
  status: AuditoriaDetalleStatus;
}

/** Respuesta estándar del endpoint de detalle */
export interface DetalleAuditoriaResponse {
  filtros: ConsultarDetalleAuditoriaParams;
  total_registros: number;
  data: LecturaAuditoriaDetalleItem[];
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

  // Método 1: Solo métricas
  getReconciliationKpis(
    params: ReconciliationPeriod,
  ): Promise<ResumenAuditoriaResponse>;

  // Método 2: Solo grilla con filtros
  getDiscrepanciesDetail(
    params: ConsultarDetalleAuditoriaParams,
  ): Promise<DetalleAuditoriaResponse>;
}
