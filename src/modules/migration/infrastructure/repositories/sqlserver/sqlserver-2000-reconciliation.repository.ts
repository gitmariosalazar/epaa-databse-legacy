import { Injectable } from '@nestjs/common';
import {
  DuplicateReconciliationRecord,
  LecturasReconciliationRepository,
  ReconciliationMismatchRecord,
  ReconciliationMismatchStatus,
  ReconciliationPeriod,
  ReconciliationRecordSource,
  ReconciliationSummary,
} from '../../../domain/contracts/lecturas-reconciliation.repository';
import { DatabaseAbstract } from '../../../../../shared/connections/database/abstract/abstract.database';

/**
 * Reconciles `AP_LECTURAS` (legacy production table) against
 * `lecturas_postgres` (migration staging table) directly in legacy SQL
 * Server 2000, using the shared `DatabaseAbstract` connection (ODBC
 * driver via DSN).
 *
 * NOTE: same constraint as `SqlServer2000LecturasRepository` - the
 * ODBC/TDS 7.0 combination used here does not reliably support bound
 * parameters, so period values are inlined into the SQL text. They are
 * validated (`ReconciliationService.buildPeriod`) and escaped before being
 * inlined, and T-SQL is kept SQL Server 2000-compatible (no CTEs, no
 * `TRIM()`, no `FILTER`).
 */
@Injectable()
export class SqlServer2000ReconciliationRepository implements LecturasReconciliationRepository {
  constructor(private readonly databaseService: DatabaseAbstract) {}

  async getSummary(
    period: ReconciliationPeriod,
  ): Promise<ReconciliationSummary> {
    const anio = this.sqlString(period.anio);
    const mesTexto = this.sqlString(period.mesTexto);
    const mesLectura = this.sqlString(period.mesLectura);

    const rows = await this.databaseService.query<{
      totalPostgres: number;
      totalApLecturas: number;
      matched: number;
      mismatched: number;
      missingInApLecturas: number;
    }>(
      `SELECT
          (SELECT COUNT(*) FROM lecturas_postgres WHERE mes_lectura = ${mesLectura}) AS totalPostgres,
          (SELECT COUNT(*) FROM AP_LECTURAS WHERE Anio = ${anio} AND Mes = ${mesTexto}) AS totalApLecturas,
          SUM(CASE WHEN estado = 'IGUAL' THEN 1 ELSE 0 END) AS matched,
          SUM(CASE WHEN estado = 'DIFERENTE' THEN 1 ELSE 0 END) AS mismatched,
          SUM(CASE WHEN estado = 'SOLO_EN_POSTGRES' THEN 1 ELSE 0 END) AS missingInApLecturas
       FROM (
          SELECT
              CASE
                  WHEN l.ClaveCatastral IS NULL THEN 'SOLO_EN_POSTGRES'
                  WHEN l.LecturaAnterior <> b.lectura_anterior
                    OR l.LecturaActual <> b.lectura_actual
                  THEN 'DIFERENTE'
                  ELSE 'IGUAL'
              END AS estado
          FROM lecturas_postgres b
          LEFT JOIN AP_LECTURAS l
              ON LTRIM(RTRIM(l.ClaveCatastral)) = LTRIM(RTRIM(b.acometida_id))
             AND l.Anio = ${anio} AND l.Mes = ${mesTexto}
          WHERE b.mes_lectura = ${mesLectura}
       ) x`,
    );

    const row = rows[0];
    return {
      totalPostgres: Number(row?.totalPostgres ?? 0),
      totalApLecturas: Number(row?.totalApLecturas ?? 0),
      matched: Number(row?.matched ?? 0),
      mismatched: Number(row?.mismatched ?? 0),
      missingInApLecturas: Number(row?.missingInApLecturas ?? 0),
    };
  }

  async getDuplicates(
    period: ReconciliationPeriod,
  ): Promise<DuplicateReconciliationRecord[]> {
    const anio = this.sqlString(period.anio);
    const mesTexto = this.sqlString(period.mesTexto);
    const mesLectura = this.sqlString(period.mesLectura);

    const rows = await this.databaseService.query<{
      source: ReconciliationRecordSource;
      identifier: string | null;
      anio: string | null;
      mes: string | null;
      occurrences: number;
    }>(
      `SELECT 'AP_LECTURAS' AS source, ClaveCatastral AS identifier, Anio AS anio, Mes AS mes, COUNT(*) AS occurrences
       FROM AP_LECTURAS
       WHERE Anio = ${anio} AND Mes = ${mesTexto}
       GROUP BY ClaveCatastral, Anio, Mes
       HAVING COUNT(*) > 1

       UNION ALL

       SELECT 'LECTURAS_POSTGRES' AS source, acometida_id AS identifier, NULL AS anio, mes_lectura AS mes, COUNT(*) AS occurrences
       FROM lecturas_postgres
       WHERE mes_lectura = ${mesLectura}
       GROUP BY acometida_id, mes_lectura
       HAVING COUNT(*) > 1`,
    );

    return rows.map((row) => ({
      source: row.source,
      identifier: row.identifier,
      anio: row.anio,
      mes: row.mes,
      occurrences: Number(row.occurrences),
    }));
  }

  async getMismatches(
    period: ReconciliationPeriod,
  ): Promise<ReconciliationMismatchRecord[]> {
    const anio = this.sqlString(period.anio);
    const mesTexto = this.sqlString(period.mesTexto);
    const mesLectura = this.sqlString(period.mesLectura);

    const rows = await this.databaseService.query<{
      acometida_id: string | null;
      mes_lectura: string | null;
      ClaveCatastral: string | null;
      pg_lectura_anterior: number | null;
      ap_lectura_anterior: number | null;
      pg_lectura_actual: number | null;
      ap_lectura_actual: number | null;
      status: ReconciliationMismatchStatus;
    }>(
      `SELECT
          b.acometida_id, b.mes_lectura, l.ClaveCatastral,
          b.lectura_anterior AS pg_lectura_anterior, l.LecturaAnterior AS ap_lectura_anterior,
          b.lectura_actual AS pg_lectura_actual, l.LecturaActual AS ap_lectura_actual,
          CASE WHEN l.ClaveCatastral IS NULL THEN 'SOLO_EN_POSTGRES' ELSE 'DIFERENTE' END AS status
       FROM lecturas_postgres b
       LEFT JOIN AP_LECTURAS l
           ON LTRIM(RTRIM(l.ClaveCatastral)) = LTRIM(RTRIM(b.acometida_id))
          AND l.Anio = ${anio} AND l.Mes = ${mesTexto}
       WHERE b.mes_lectura = ${mesLectura}
         AND (
               l.ClaveCatastral IS NULL
               OR l.LecturaAnterior <> b.lectura_anterior
               OR l.LecturaActual <> b.lectura_actual
             )`,
    );

    return rows.map((row) => ({
      acometidaId: row.acometida_id,
      mesLectura: row.mes_lectura,
      claveCatastral: row.ClaveCatastral,
      postgresLecturaAnterior:
        row.pg_lectura_anterior === null
          ? null
          : Number(row.pg_lectura_anterior),
      legacyLecturaAnterior:
        row.ap_lectura_anterior === null
          ? null
          : Number(row.ap_lectura_anterior),
      postgresLecturaActual:
        row.pg_lectura_actual === null ? null : Number(row.pg_lectura_actual),
      legacyLecturaActual:
        row.ap_lectura_actual === null ? null : Number(row.ap_lectura_actual),
      status: row.status,
    }));
  }

  private sqlString(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
  }
}
