import { Injectable } from '@nestjs/common';
import {
  ConsultarDetalleAuditoriaParams,
  DetalleAuditoriaResponse,
  DuplicateReconciliationRecord,
  LecturaAuditoriaDetalleItem,
  LecturaAuditoriaResumen,
  LecturasReconciliationRepository,
  ReconciliationMismatchRecord,
  ReconciliationMismatchStatus,
  ReconciliationPeriod,
  ReconciliationRecordSource,
  ReconciliationSummary,
  ResumenAuditoriaResponse,
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

  async getDiscrepanciesDetail(
    params: ConsultarDetalleAuditoriaParams,
  ): Promise<DetalleAuditoriaResponse> {
    try {
      let filtroStatus = "r.status <> 'OK'";
      if (params.tipo_filtro === 'DUPLICADOS') filtroStatus = "r.status = 'DUPLICADO_EN_SQL_SERVER'";
      if (params.tipo_filtro === 'DIFERENTES') filtroStatus = "r.status = 'DIFERENTE'";
      if (params.tipo_filtro === 'SOLO_POSTGRES') filtroStatus = "r.status = 'SOLO_EN_POSTGRES'";

      const query = `
SELECT
    r.*
FROM (
    SELECT
        b.acometida_id,
        b.mes_lectura,
        b.lectura_anterior AS pg_lectura_anterior,
        l.ap_lectura_anterior,
        b.lectura_actual   AS pg_lectura_actual,
        l.ap_lectura_actual,
        COALESCE(l.total_en_sql_server, 0) AS total_en_sql_server,
        CASE
            WHEN l.ClaveCatastral IS NULL THEN 'SOLO_EN_POSTGRES'
            WHEN l.total_en_sql_server > 1 THEN 'DUPLICADO_EN_SQL_SERVER'
            WHEN COALESCE(l.ap_lectura_anterior, -1) <> COALESCE(b.lectura_anterior, -1)
              OR COALESCE(l.ap_lectura_actual, -1)   <> COALESCE(b.lectura_actual, -1) THEN 'DIFERENTE'
            ELSE 'OK'
        END AS status
    FROM lecturas_postgres b
    LEFT JOIN (
        SELECT
            LTRIM(RTRIM(ClaveCatastral)) AS ClaveCatastral,
            MAX(LecturaAnterior) AS ap_lectura_anterior,
            MAX(LecturaActual)   AS ap_lectura_actual,
            COUNT(*)             AS total_en_sql_server
        FROM AP_LECTURAS
        WHERE Anio = ${this.sqlString(params.periodo.anio)}
          AND UPPER(LTRIM(RTRIM(Mes))) = ${this.sqlString(params.periodo.mesTexto.toUpperCase())} 
        GROUP BY LTRIM(RTRIM(ClaveCatastral))
    ) l ON LTRIM(RTRIM(b.acometida_id)) = l.ClaveCatastral
    WHERE b.mes_lectura = ${this.sqlString(params.periodo.mesLectura)}
) r
WHERE
    ${filtroStatus}
ORDER BY r.status DESC, r.acometida_id ASC;
      `;

      const rows =
        await this.databaseService.query<LecturaAuditoriaDetalleItem>(query);

      return {
        filtros: params,
        total_registros: rows.length,
        data: rows.map((row) => ({
          acometida_id: row.acometida_id,
          mes_lectura: row.mes_lectura,
          pg_lectura_anterior: Number(row.pg_lectura_anterior),
          ap_lectura_anterior:
            row.ap_lectura_anterior === null
              ? null
              : Number(row.ap_lectura_anterior),
          pg_lectura_actual: Number(row.pg_lectura_actual),
          ap_lectura_actual:
            row.ap_lectura_actual === null
              ? null
              : Number(row.ap_lectura_actual),
          total_en_sql_server: Number(row.total_en_sql_server),
          status: row.status,
        })),
      };
    } catch (error) {
      throw new Error(`Error obteniendo el detalle de auditoría: ${error}`);
    }
  }
  async getReconciliationKpis(
    params: ReconciliationPeriod,
  ): Promise<ResumenAuditoriaResponse> {
    try {
      const query = `

SELECT
    COUNT(*) AS total_cuentas_revisadas,
    SUM(CASE WHEN c.estado_auditoria = 'CONCILIADO_OK' THEN 1 ELSE 0 END) AS total_conciliados_ok,
    SUM(CASE WHEN c.estado_auditoria = 'LECTURA_DIFERENTE' THEN 1 ELSE 0 END) AS total_lecturas_discrepantes,
    SUM(CASE WHEN c.estado_auditoria = 'CON_DUPLICADOS' THEN 1 ELSE 0 END) AS total_con_duplicados,
    SUM(CASE WHEN c.cant_pg > 1 THEN 1 ELSE 0 END) AS cuentas_duplicadas_en_origen,
    SUM(CASE WHEN c.cant_sql > 1 THEN 1 ELSE 0 END) AS cuentas_duplicadas_en_ap_lecturas,
    SUM(CASE WHEN c.estado_auditoria = 'SOLO_EN_ORIGEN' THEN 1 ELSE 0 END) AS total_pendientes_migrar,
    SUM(CASE WHEN c.estado_auditoria = 'SOLO_EN_AP_LECTURAS' THEN 1 ELSE 0 END) AS total_huerfanas_en_ap,
    ROUND(
        (CAST(SUM(CASE WHEN c.estado_auditoria = 'CONCILIADO_OK' THEN 1 ELSE 0 END) AS FLOAT) /
         NULLIF(COUNT(*), 0)) * 100,
        2
    ) AS porcentaje_sincronizacion
FROM (
    SELECT
        COALESCE(p.clave, s.clave) AS clave,
        COALESCE(p.cant_pg, 0)     AS cant_pg,
        COALESCE(s.cant_sql, 0)    AS cant_sql,
        p.pg_ant, p.pg_act,
        s.ap_ant, s.ap_act,
        CASE
            WHEN p.clave IS NOT NULL AND s.clave IS NULL THEN 'SOLO_EN_ORIGEN'
            WHEN p.clave IS NULL AND s.clave IS NOT NULL THEN 'SOLO_EN_AP_LECTURAS'
            WHEN COALESCE(p.cant_pg, 0) > 1 OR COALESCE(s.cant_sql, 0) > 1 THEN 'CON_DUPLICADOS'
            WHEN p.pg_ant <> s.ap_ant OR p.pg_act <> s.ap_act THEN 'LECTURA_DIFERENTE'
            ELSE 'CONCILIADO_OK'
        END AS estado_auditoria
    FROM (
        SELECT
            LTRIM(RTRIM(CAST(acometida_id AS VARCHAR(50)))) AS clave,
            MAX(COALESCE(lectura_anterior, 0)) AS pg_ant,
            MAX(COALESCE(lectura_actual, 0))   AS pg_act,
            COUNT(*) AS cant_pg
        FROM lecturas_postgres
        WHERE mes_lectura = ${this.sqlString(params.mesLectura)}
        GROUP BY LTRIM(RTRIM(CAST(acometida_id AS VARCHAR(50))))
    ) p
    FULL OUTER JOIN (
        SELECT
            LTRIM(RTRIM(CAST(ClaveCatastral AS VARCHAR(50)))) AS clave,
            MAX(COALESCE(LecturaAnterior, 0)) AS ap_ant,
            MAX(COALESCE(LecturaActual, 0))   AS ap_act,
            COUNT(*) AS cant_sql
        FROM AP_LECTURAS
        WHERE Anio = ${this.sqlString(params.anio)}
          AND UPPER(LTRIM(RTRIM(Mes))) = ${this.sqlString(params.mesTexto.toUpperCase())}
        GROUP BY LTRIM(RTRIM(CAST(ClaveCatastral AS VARCHAR(50))))
    ) s ON p.clave = s.clave
) c;
 `;

      const rows =
        await this.databaseService.query<LecturaAuditoriaResumen>(query);
      const row = rows[0];

      return {
        periodo: params,
        data: {
          total_cuentas_revisadas: Number(row?.total_cuentas_revisadas ?? 0),
          total_conciliados_ok: Number(row?.total_conciliados_ok ?? 0),
          total_lecturas_discrepantes: Number(row?.total_lecturas_discrepantes ?? 0),
          total_con_duplicados: Number(row?.total_con_duplicados ?? 0),
          cuentas_duplicadas_en_origen: Number(row?.cuentas_duplicadas_en_origen ?? 0),
          cuentas_duplicadas_en_ap_lecturas: Number(row?.cuentas_duplicadas_en_ap_lecturas ?? 0),
          total_pendientes_migrar: Number(row?.total_pendientes_migrar ?? 0),
          total_huerfanas_en_ap: Number(row?.total_huerfanas_en_ap ?? 0),
          porcentaje_sincronizacion: Number(row?.porcentaje_sincronizacion ?? 0),
        },
      };
    } catch (error) {
      throw new Error(`Error obteniendo el resumen de auditoría: ${error}`);
    }
  }
}
