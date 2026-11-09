import { Injectable, Logger } from '@nestjs/common';
import {
  InterfaceLegacyAnalyticsRepository,
  LegacyExecutiveDashboardFilter,
  LegacySectorPerformanceFilter,
  LegacyMonthlyTrendFilter,
  LegacyNoveltyEconomicImpactFilter,
  LegacyTopConsumersFilter,
  LegacyInterannualComparisonFilter,
} from '../../../../domain/contracts/legacy-analytics.interface.repository';
import { LegacyExecutiveDashboardModel } from '../../../../domain/schemas/model/legacy-executive-dashboard.model';
import { LegacySectorPerformanceModel } from '../../../../domain/schemas/model/legacy-sector-performance.model';
import { LegacyMonthlyTrendModel } from '../../../../domain/schemas/model/legacy-monthly-trend.model';
import { LegacyNoveltyEconomicImpactModel } from '../../../../domain/schemas/model/legacy-novelty-economic-impact.model';
import { LegacyTopConsumerModel } from '../../../../domain/schemas/model/legacy-top-consumer.model';
import { LegacyInterannualComparisonModel } from '../../../../domain/schemas/model/legacy-interannual-comparison.model';

import {
  LegacyExecutiveDashboardSqlResult,
  LegacySectorPerformanceSqlResult,
  LegacyMonthlyTrendSqlResult,
  LegacyNoveltyEconomicImpactSqlResult,
  LegacyTopConsumerSqlResult,
  LegacyInterannualComparisonSqlResult,
} from '../../../interfaces/sql/legacy-analytics-sql.interface';
import { LegacyAnalyticsSQLAdapter } from '../../../adapters/legacy-analytics-sql.adapter';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { MONTHS, MONTHS_REVERSE } from '../../../../../../shared/consts/months';

@Injectable()
export class LegacyAnalyticsSQLServer2022Persistence
  implements InterfaceLegacyAnalyticsRepository
{
  private readonly logger = new Logger(LegacyAnalyticsSQLServer2022Persistence.name);

  constructor(private readonly databaseService: DatabaseAbstract) {}

  private resolveMonthAndYear(
    filterYear?: number,
    filterMonth?: number | string,
  ): { year: number; monthNum: number; monthName: string } {
    let year = filterYear ?? 2026;
    let monthNum = 10;

    if (filterMonth !== undefined && filterMonth !== null) {
      if (typeof filterMonth === 'number') {
        monthNum = Math.max(1, Math.min(12, filterMonth));
      } else {
        const clean = filterMonth.trim().toUpperCase();
        if (clean.includes('-')) {
          const parts = clean.split('-');
          year = parseInt(parts[0], 10) || year;
          monthNum = parseInt(parts[1], 10) || monthNum;
        } else if (!isNaN(Number(clean))) {
          monthNum = parseInt(clean, 10);
        } else if (MONTHS_REVERSE[clean]) {
          monthNum = MONTHS_REVERSE[clean];
        }
      }
    }

    const monthName = MONTHS[monthNum] || 'OCTUBRE';
    return { year, monthNum, monthName };
  }

  async getExecutiveDashboard(
    filter: LegacyExecutiveDashboardFilter,
  ): Promise<LegacyExecutiveDashboardModel> {
    const { year, monthNum, monthName } = this.resolveMonthAndYear(
      filter.year,
      filter.month,
    );

    const sectorFilter =
      filter.sector !== undefined && filter.sector !== null
        ? `AND L.Sector = ${Number(filter.sector)}`
        : '';

    const query = `
      WITH CTE_Lecturas AS (
          SELECT
              L.Anio,
              L.Mes,
              L.Sector,
              L.ClaveCatastral,
              CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END AS M3,
              CASE 
                  WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 
                      THEN ISNULL(L.valor_consumo_agua, 0)
                  ELSE ISNULL(L.ValorAPagar, 0)
              END AS Agua_USD,
              CASE 
                  WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 
                      THEN ISNULL(L.valor_tasa_alcantarillado, 0)
                  ELSE ISNULL(L.TasaAlcantarillado, 0)
              END AS Alcantarillado_USD,
              ISNULL(L.Novedad, 'NORMAL') AS Novedad
          FROM AP_LECTURAS L
          WHERE L.Anio = ${year}
            AND ((L.mesnum = ${monthNum}) OR (UPPER(RTRIM(L.Mes)) = '${monthName}'))
            ${sectorFilter}
      )
      SELECT
          Anio                                                                AS PeriodoAnio,
          Mes                                                                 AS PeriodoMes,
          COUNT(*)                                                            AS TotalLecturasTomadas,
          COUNT(DISTINCT Sector)                                              AS TotalSectoresCubiertos,
          COUNT(DISTINCT ClaveCatastral)                                      AS TotalAcometidasActivas,
          CAST(SUM(M3) AS DECIMAL(18,2))                                      AS VolumenTotal_M3,
          CAST(AVG(CAST(M3 AS DECIMAL(18,2))) AS DECIMAL(18,2))               AS ConsumoPromedioPorCuenta_M3,
          CAST(MIN(M3) AS DECIMAL(18,2))                                      AS ConsumoMinimo_M3,
          CAST(MAX(M3) AS DECIMAL(18,2))                                      AS ConsumoMaximo_M3,
          CAST(SUM(Agua_USD) AS DECIMAL(18,2))                                AS RecaudacionAgua_USD,
          CAST(SUM(Alcantarillado_USD) AS DECIMAL(18,2))                      AS RecaudacionAlcantarillado_USD,
          CAST(SUM(Agua_USD + Alcantarillado_USD) AS DECIMAL(18,2))           AS FacturacionTotal_USD,
          CAST(AVG(Agua_USD + Alcantarillado_USD) AS DECIMAL(18,2))           AS TicketPromedioPorCuenta_USD,
          CAST(
              CASE 
                  WHEN SUM(M3) > 0 
                  THEN SUM(Agua_USD) / SUM(CAST(M3 AS DECIMAL(18,2)))
                  ELSE 0 
              END AS DECIMAL(18,4)
          )                                                                   AS TarifaEfectivaMedia_USD_M3,
          SUM(CASE WHEN Novedad NOT IN ('NORMAL', 'LECTURA NORMAL') THEN 1 ELSE 0 END) AS TotalLecturasConNovedad,
          CAST(
              (SUM(CASE WHEN Novedad NOT IN ('NORMAL', 'LECTURA NORMAL') THEN 1.0 ELSE 0.0 END) / NULLIF(COUNT(*), 0)) * 100.0 
              AS DECIMAL(5,2)
          )                                                                   AS PorcentajeNovedadOperativa
      FROM CTE_Lecturas
      GROUP BY Anio, Mes;
    `;

    const results =
      await this.databaseService.query<LegacyExecutiveDashboardSqlResult>(query);

    if (results.length === 0) {
      return new LegacyExecutiveDashboardModel(
        year,
        monthName,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      );
    }

    return LegacyAnalyticsSQLAdapter.toExecutiveDashboardModel(results[0]);
  }

  async getSectorPerformance(
    filter: LegacySectorPerformanceFilter,
  ): Promise<LegacySectorPerformanceModel[]> {
    const { year, monthNum, monthName } = this.resolveMonthAndYear(
      filter.year,
      filter.month,
    );

    const sectorFilter =
      filter.sector !== undefined && filter.sector !== null
        ? `AND L.Sector = ${Number(filter.sector)}`
        : '';

    let orderByClause = 'ORDER BY TotalFacturado_USD DESC';
    if (filter.sortBy === 'volume') {
      orderByClause = 'ORDER BY M3_Consumidos DESC';
    } else if (filter.sortBy === 'readings') {
      orderByClause = 'ORDER BY TotalLecturas DESC';
    } else if (filter.sortBy === 'sector') {
      orderByClause = 'ORDER BY Sector ASC';
    }

    const query = `
      WITH CTE_Sector AS (
          SELECT
              L.Sector,
              COUNT(*)                                                        AS TotalLecturas,
              SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) AS M3_Consumidos,
              CAST(AVG(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN CAST((L.LecturaActual - L.LecturaAnterior) AS DECIMAL(18,2)) ELSE 0 END) AS DECIMAL(18,2)) AS ConsumoPromedio_M3,
              CAST(SUM(CASE WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 THEN ISNULL(L.valor_consumo_agua, 0) ELSE ISNULL(L.ValorAPagar, 0) END) AS DECIMAL(18,2)) AS TotalAgua_USD,
              CAST(SUM(CASE WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 THEN ISNULL(L.valor_tasa_alcantarillado, 0) ELSE ISNULL(L.TasaAlcantarillado, 0) END) AS DECIMAL(18,2)) AS TotalAlcantarillado_USD,
              CAST(SUM(CASE WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 THEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) ELSE ISNULL(L.ValorAPagar, 0) + ISNULL(L.TasaAlcantarillado, 0) END) AS DECIMAL(18,2)) AS TotalFacturado_USD,
              SUM(CASE WHEN ISNULL(L.Novedad, 'NORMAL') NOT IN ('NORMAL', 'LECTURA NORMAL') THEN 1 ELSE 0 END) AS CasosConNovedad
          FROM AP_LECTURAS L
          WHERE L.Anio = ${year} 
            AND ((L.mesnum = ${monthNum}) OR (UPPER(RTRIM(L.Mes)) = '${monthName}'))
            ${sectorFilter}
          GROUP BY L.Sector
      )
      SELECT
          Sector,
          TotalLecturas,
          M3_Consumidos,
          ConsumoPromedio_M3,
          TotalAgua_USD,
          TotalAlcantarillado_USD,
          TotalFacturado_USD,
          ROUND((TotalFacturado_USD / NULLIF(SUM(TotalFacturado_USD) OVER (), 0)) * 100.0, 2) AS PctAporteIngresos,
          ROUND((M3_Consumidos / NULLIF(SUM(M3_Consumidos) OVER (), 0)) * 100.0, 2) AS PctAporteVolumen_M3,
          CAST(
              CASE 
                  WHEN M3_Consumidos > 0
                  THEN TotalAgua_USD / M3_Consumidos
                  ELSE 0 
              END AS DECIMAL(10,4)
          ) AS TarifaEfectiva_USD_M3,
          CasosConNovedad,
          ROUND((CasosConNovedad * 100.0) / NULLIF(TotalLecturas, 0), 2) AS PctIncidencias,
          DENSE_RANK() OVER (ORDER BY TotalFacturado_USD DESC) AS RankRecaudacion,
          DENSE_RANK() OVER (ORDER BY M3_Consumidos DESC) AS RankConsumoM3
      FROM CTE_Sector
      ${orderByClause};
    `;

    const results =
      await this.databaseService.query<LegacySectorPerformanceSqlResult>(query);

    return LegacyAnalyticsSQLAdapter.toSectorPerformanceModelList(results);
  }

  async getMonthlyTrend(
    filter: LegacyMonthlyTrendFilter,
  ): Promise<LegacyMonthlyTrendModel[]> {
    const year = filter.year ?? 2026;
    const startMonth = filter.startMonthNumber ?? 1;
    const endMonth = filter.endMonthNumber ?? 12;

    const sectorFilter =
      filter.sector !== undefined && filter.sector !== null
        ? `AND L.Sector = ${Number(filter.sector)}`
        : '';

    const query = `
      WITH CTE_Meses AS (
          SELECT
              L.Anio,
              CASE 
                  WHEN L.mesnum IS NOT NULL THEN L.mesnum
                  WHEN UPPER(RTRIM(L.Mes)) = 'ENERO' THEN 1
                  WHEN UPPER(RTRIM(L.Mes)) = 'FEBRERO' THEN 2
                  WHEN UPPER(RTRIM(L.Mes)) = 'MARZO' THEN 3
                  WHEN UPPER(RTRIM(L.Mes)) = 'ABRIL' THEN 4
                  WHEN UPPER(RTRIM(L.Mes)) = 'MAYO' THEN 5
                  WHEN UPPER(RTRIM(L.Mes)) = 'JUNIO' THEN 6
                  WHEN UPPER(RTRIM(L.Mes)) = 'JULIO' THEN 7
                  WHEN UPPER(RTRIM(L.Mes)) = 'AGOSTO' THEN 8
                  WHEN UPPER(RTRIM(L.Mes)) = 'SEPTIEMBRE' THEN 9
                  WHEN UPPER(RTRIM(L.Mes)) = 'OCTUBRE' THEN 10
                  WHEN UPPER(RTRIM(L.Mes)) = 'NOVIEMBRE' THEN 11
                  WHEN UPPER(RTRIM(L.Mes)) = 'DICIEMBRE' THEN 12
                  ELSE 0 
              END AS MesNumero,
              UPPER(RTRIM(L.Mes)) AS NombreMes,
              COUNT(*) AS TotalLecturas,
              SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) AS VolumenTotal_M3,
              CAST(SUM(CASE WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 THEN ISNULL(L.valor_consumo_agua, 0) ELSE ISNULL(L.ValorAPagar, 0) END) AS DECIMAL(18,2)) AS IngresoAgua_USD,
              CAST(SUM(CASE WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 THEN ISNULL(L.valor_tasa_alcantarillado, 0) ELSE ISNULL(L.TasaAlcantarillado, 0) END) AS DECIMAL(18,2)) AS IngresoAlcantarillado_USD,
              CAST(SUM(CASE WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 THEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) ELSE ISNULL(L.ValorAPagar, 0) + ISNULL(L.TasaAlcantarillado, 0) END) AS DECIMAL(18,2)) AS IngresoTotal_USD
          FROM AP_LECTURAS L
          WHERE L.Anio = ${year}
            ${sectorFilter}
          GROUP BY L.Anio, 
                   CASE 
                       WHEN L.mesnum IS NOT NULL THEN L.mesnum
                       WHEN UPPER(RTRIM(L.Mes)) = 'ENERO' THEN 1
                       WHEN UPPER(RTRIM(L.Mes)) = 'FEBRERO' THEN 2
                       WHEN UPPER(RTRIM(L.Mes)) = 'MARZO' THEN 3
                       WHEN UPPER(RTRIM(L.Mes)) = 'ABRIL' THEN 4
                       WHEN UPPER(RTRIM(L.Mes)) = 'MAYO' THEN 5
                       WHEN UPPER(RTRIM(L.Mes)) = 'JUNIO' THEN 6
                       WHEN UPPER(RTRIM(L.Mes)) = 'JULIO' THEN 7
                       WHEN UPPER(RTRIM(L.Mes)) = 'AGOSTO' THEN 8
                       WHEN UPPER(RTRIM(L.Mes)) = 'SEPTIEMBRE' THEN 9
                       WHEN UPPER(RTRIM(L.Mes)) = 'OCTUBRE' THEN 10
                       WHEN UPPER(RTRIM(L.Mes)) = 'NOVIEMBRE' THEN 11
                       WHEN UPPER(RTRIM(L.Mes)) = 'DICIEMBRE' THEN 12
                       ELSE 0 
                   END,
                   UPPER(RTRIM(L.Mes))
      )
      SELECT
          Anio,
          MesNumero,
          NombreMes,
          TotalLecturas,
          VolumenTotal_M3,
          VolumenTotal_M3 - LAG(VolumenTotal_M3) OVER (ORDER BY MesNumero) AS DeltaVolumen_M3,
          ROUND(((VolumenTotal_M3 - LAG(VolumenTotal_M3) OVER (ORDER BY MesNumero)) * 100.0) / NULLIF(LAG(VolumenTotal_M3) OVER (ORDER BY MesNumero), 0), 2) AS PctCrecimiento_M3,
          IngresoAgua_USD,
          IngresoAlcantarillado_USD,
          IngresoTotal_USD,
          IngresoTotal_USD - LAG(IngresoTotal_USD) OVER (ORDER BY MesNumero) AS DeltaIngresos_USD,
          ROUND(((IngresoTotal_USD - LAG(IngresoTotal_USD) OVER (ORDER BY MesNumero)) * 100.0) / NULLIF(LAG(IngresoTotal_USD) OVER (ORDER BY MesNumero), 0), 2) AS PctCrecimiento_Ingresos
      FROM CTE_Meses
      WHERE MesNumero BETWEEN ${startMonth} AND ${endMonth}
      ORDER BY MesNumero ASC;
    `;

    const results =
      await this.databaseService.query<LegacyMonthlyTrendSqlResult>(query);

    return LegacyAnalyticsSQLAdapter.toMonthlyTrendModelList(results);
  }

  async getNoveltyEconomicImpact(
    filter: LegacyNoveltyEconomicImpactFilter,
  ): Promise<LegacyNoveltyEconomicImpactModel[]> {
    const { year, monthNum, monthName } = this.resolveMonthAndYear(
      filter.year,
      filter.month,
    );

    const sectorFilter =
      filter.sector !== undefined && filter.sector !== null
        ? `AND L.Sector = ${Number(filter.sector)}`
        : '';

    const query = `
      WITH CTE_Novedades AS (
          SELECT
              ISNULL(L.Novedad, 'SIN NOVEDAD')                                AS Novedad,
              COUNT(*)                                                        AS TotalCasos,
              SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) AS Volumen_M3,
              CAST(AVG(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN CAST((L.LecturaActual - L.LecturaAnterior) AS DECIMAL(18,2)) ELSE 0 END) AS DECIMAL(18,2)) AS Promedio_M3,
              CAST(SUM(CASE WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 THEN ISNULL(L.valor_consumo_agua, 0) ELSE ISNULL(L.ValorAPagar, 0) END) AS DECIMAL(18,2)) AS TotalAgua_USD,
              CAST(SUM(CASE WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 THEN ISNULL(L.valor_tasa_alcantarillado, 0) ELSE ISNULL(L.TasaAlcantarillado, 0) END) AS DECIMAL(18,2)) AS TotalAlcantarillado_USD,
              CAST(SUM(CASE WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 THEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) ELSE ISNULL(L.ValorAPagar, 0) + ISNULL(L.TasaAlcantarillado, 0) END) AS DECIMAL(18,2)) AS TotalRecaudado_USD
          FROM AP_LECTURAS L
          WHERE L.Anio = ${year} 
            AND ((L.mesnum = ${monthNum}) OR (UPPER(RTRIM(L.Mes)) = '${monthName}'))
            ${sectorFilter}
          GROUP BY L.Novedad
      )
      SELECT
          Novedad,
          TotalCasos,
          ROUND((TotalCasos * 100.0) / NULLIF(SUM(TotalCasos) OVER (), 0), 2) AS PctDelTotal,
          Volumen_M3,
          Promedio_M3,
          TotalAgua_USD,
          TotalAlcantarillado_USD,
          TotalRecaudado_USD
      FROM CTE_Novedades
      ORDER BY TotalCasos DESC;
    `;

    const results =
      await this.databaseService.query<LegacyNoveltyEconomicImpactSqlResult>(query);

    return LegacyAnalyticsSQLAdapter.toNoveltyEconomicImpactModelList(results);
  }

  async getTopConsumers(
    filter: LegacyTopConsumersFilter,
  ): Promise<LegacyTopConsumerModel[]> {
    const { year, monthNum, monthName } = this.resolveMonthAndYear(
      filter.year,
      filter.month,
    );

    const limit = Math.max(1, Math.min(filter.limit ?? 50, 500));
    let dynamicFilter = '';

    if (filter.sector !== undefined && filter.sector !== null) {
      dynamicFilter += ` AND L.Sector = ${Number(filter.sector)}`;
    }

    if (filter.minConsumptionM3 !== undefined && filter.minConsumptionM3 !== null) {
      dynamicFilter += ` AND (L.LecturaActual - L.LecturaAnterior) >= ${Number(filter.minConsumptionM3)}`;
    }

    if (filter.novelty) {
      const cleanNovelty = filter.novelty.replace(/'/g, "''");
      dynamicFilter += ` AND L.Novedad = '${cleanNovelty}'`;
    }

    const query = `
      SELECT TOP ${limit}
          ISNULL(L.id_lectura, 0)                                             AS LecturaId,
          L.Sector,
          L.Cuenta,
          L.ClaveCatastral,
          A.NumeroDeMedidor,
          A.Direccion,
          ISNULL(RTRIM(C.NOMBRES_CIUDADANO) + ' ' + RTRIM(C.APELLIDOS_CIUDADANO), 'PROPIETARIO NO REGISTRADO') AS Cliente,
          L.LecturaAnterior,
          L.LecturaActual,
          (L.LecturaActual - L.LecturaAnterior)                               AS M3_Consumidos,
          CAST(CASE WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 THEN ISNULL(L.valor_consumo_agua, 0) ELSE ISNULL(L.ValorAPagar, 0) END AS DECIMAL(18,2)) AS ValorAgua_USD,
          CAST(CASE WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 THEN ISNULL(L.valor_tasa_alcantarillado, 0) ELSE ISNULL(L.TasaAlcantarillado, 0) END AS DECIMAL(18,2)) AS ValorAlcantarillado_USD,
          CAST(CASE WHEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) > 0 THEN ISNULL(L.valor_consumo_agua, 0) + ISNULL(L.valor_tasa_alcantarillado, 0) ELSE ISNULL(L.ValorAPagar, 0) + ISNULL(L.TasaAlcantarillado, 0) END AS DECIMAL(18,2)) AS TotalFacturado_USD,
          ISNULL(L.Novedad, 'NORMAL')                                         AS Novedad,
          L.FechaCaptura,
          A.Latitud,
          A.Longitud
      FROM AP_LECTURAS L
      LEFT JOIN AP_ACOMETIDAS A 
          ON L.Sector = A.Sector AND L.Cuenta = A.Cuenta
      LEFT JOIN CIUDADANO C 
          ON A.CedulaCiudadano = C.CED_IDENT_CIUDADANO
      WHERE L.Anio = ${year} 
        AND ((L.mesnum = ${monthNum}) OR (UPPER(RTRIM(L.Mes)) = '${monthName}'))
        ${dynamicFilter}
      ORDER BY (L.LecturaActual - L.LecturaAnterior) DESC;
    `;

    const results =
      await this.databaseService.query<LegacyTopConsumerSqlResult>(query);

    return LegacyAnalyticsSQLAdapter.toTopConsumerModelList(results);
  }

  async getInterannualComparison(
    filter: LegacyInterannualComparisonFilter,
  ): Promise<LegacyInterannualComparisonModel[]> {
    const baseYear = filter.baseYear ?? 2025;
    const targetYear = filter.targetYear ?? 2026;
    const startMonth = filter.startMonthNumber ?? 1;
    const endMonth = filter.endMonthNumber ?? 10;
    const onlyHomologous = filter.onlyHomologous !== false;

    const sectorFilter =
      filter.sector !== undefined && filter.sector !== null
        ? `AND l25.Sector = ${Number(filter.sector)}`
        : '';

    let query: string;

    if (onlyHomologous) {
      // 1-to-1 exact homologous paired comparison with symmetrical reading counts
      query = `
        SELECT
            l25.Sector                                                          AS Sector,
            COUNT(DISTINCT l25.Cuenta)                                          AS Acometidas_Homologas,
            COUNT(*)                                                            AS Lecturas_2025,
            COUNT(*)                                                            AS Lecturas_2026,
            0                                                                   AS Delta_Lecturas,
            SUM(CASE WHEN l25.LecturaActual >= l25.LecturaAnterior THEN (l25.LecturaActual - l25.LecturaAnterior) ELSE 0 END) AS M3_2025,
            SUM(CASE WHEN l26.LecturaActual >= l26.LecturaAnterior THEN (l26.LecturaActual - l26.LecturaAnterior) ELSE 0 END) AS M3_2026,
            (SUM(CASE WHEN l26.LecturaActual >= l26.LecturaAnterior THEN (l26.LecturaActual - l26.LecturaAnterior) ELSE 0 END) -
             SUM(CASE WHEN l25.LecturaActual >= l25.LecturaAnterior THEN (l25.LecturaActual - l25.LecturaAnterior) ELSE 0 END)) AS Delta_M3,
            CAST(
                CASE 
                    WHEN SUM(CASE WHEN l25.LecturaActual >= l25.LecturaAnterior THEN (l25.LecturaActual - l25.LecturaAnterior) ELSE 0 END) > 0 
                    THEN ((SUM(CASE WHEN l26.LecturaActual >= l26.LecturaAnterior THEN (l26.LecturaActual - l26.LecturaAnterior) ELSE 0 END) -
                           SUM(CASE WHEN l25.LecturaActual >= l25.LecturaAnterior THEN (l25.LecturaActual - l25.LecturaAnterior) ELSE 0 END)) * 100.0) /
                          SUM(CASE WHEN l25.LecturaActual >= l25.LecturaAnterior THEN (l25.LecturaActual - l25.LecturaAnterior) ELSE 0 END)
                    ELSE 0.0 
                END AS DECIMAL(6,2)
            )                                                                   AS Pct_Var_M3,
            CAST(SUM(ISNULL(l25.ValorAPagar, 0) + ISNULL(l25.TasaAlcantarillado, 0)) AS DECIMAL(18,2)) AS Facturado_2025_USD,
            CAST(SUM(
                CASE 
                    WHEN ISNULL(l26.valor_consumo_agua, 0) + ISNULL(l26.valor_tasa_alcantarillado, 0) > 0 
                        THEN ISNULL(l26.valor_consumo_agua, 0) + ISNULL(l26.valor_tasa_alcantarillado, 0)
                    ELSE ISNULL(l26.ValorAPagar, 0) + ISNULL(l26.TasaAlcantarillado, 0)
                END
            ) AS DECIMAL(18,2))                                                 AS Facturado_2026_USD,
            CAST((SUM(
                CASE 
                    WHEN ISNULL(l26.valor_consumo_agua, 0) + ISNULL(l26.valor_tasa_alcantarillado, 0) > 0 
                        THEN ISNULL(l26.valor_consumo_agua, 0) + ISNULL(l26.valor_tasa_alcantarillado, 0)
                    ELSE ISNULL(l26.ValorAPagar, 0) + ISNULL(l26.TasaAlcantarillado, 0)
                END
            ) - SUM(ISNULL(l25.ValorAPagar, 0) + ISNULL(l25.TasaAlcantarillado, 0))) AS DECIMAL(18,2)) AS Delta_USD,
            CAST(
                CASE 
                    WHEN SUM(ISNULL(l25.ValorAPagar, 0) + ISNULL(l25.TasaAlcantarillado, 0)) > 0 
                    THEN ((SUM(
                        CASE 
                            WHEN ISNULL(l26.valor_consumo_agua, 0) + ISNULL(l26.valor_tasa_alcantarillado, 0) > 0 
                                THEN ISNULL(l26.valor_consumo_agua, 0) + ISNULL(l26.valor_tasa_alcantarillado, 0)
                            ELSE ISNULL(l26.ValorAPagar, 0) + ISNULL(l26.TasaAlcantarillado, 0)
                        END
                    ) - SUM(ISNULL(l25.ValorAPagar, 0) + ISNULL(l25.TasaAlcantarillado, 0))) * 100.0) /
                          SUM(ISNULL(l25.ValorAPagar, 0) + ISNULL(l25.TasaAlcantarillado, 0))
                    ELSE 0.0 
                END AS DECIMAL(6,2)
            )                                                                   AS Pct_Var_USD,
            CASE
                WHEN CAST(
                    CASE 
                        WHEN SUM(ISNULL(l25.ValorAPagar, 0) + ISNULL(l25.TasaAlcantarillado, 0)) > 0 
                        THEN ((SUM(
                            CASE 
                                WHEN ISNULL(l26.valor_consumo_agua, 0) + ISNULL(l26.valor_tasa_alcantarillado, 0) > 0 
                                    THEN ISNULL(l26.valor_consumo_agua, 0) + ISNULL(l26.valor_tasa_alcantarillado, 0)
                                ELSE ISNULL(l26.ValorAPagar, 0) + ISNULL(l26.TasaAlcantarillado, 0)
                            END
                        ) - SUM(ISNULL(l25.ValorAPagar, 0) + ISNULL(l25.TasaAlcantarillado, 0))) * 100.0) /
                              SUM(ISNULL(l25.ValorAPagar, 0) + ISNULL(l25.TasaAlcantarillado, 0))
                        ELSE 0.0 
                    END AS DECIMAL(6,2)) > 15.0 THEN 'ALTA RECUPERACION (>+15%)'
                WHEN CAST(
                    CASE 
                        WHEN SUM(ISNULL(l25.ValorAPagar, 0) + ISNULL(l25.TasaAlcantarillado, 0)) > 0 
                        THEN ((SUM(
                            CASE 
                                WHEN ISNULL(l26.valor_consumo_agua, 0) + ISNULL(l26.valor_tasa_alcantarillado, 0) > 0 
                                    THEN ISNULL(l26.valor_consumo_agua, 0) + ISNULL(l26.valor_tasa_alcantarillado, 0)
                                ELSE ISNULL(l26.ValorAPagar, 0) + ISNULL(l26.TasaAlcantarillado, 0)
                            END
                        ) - SUM(ISNULL(l25.ValorAPagar, 0) + ISNULL(l25.TasaAlcantarillado, 0))) * 100.0) /
                              SUM(ISNULL(l25.ValorAPagar, 0) + ISNULL(l25.TasaAlcantarillado, 0))
                        ELSE 0.0 
                    END AS DECIMAL(6,2)) < -10.0 THEN 'CAIDA RECAUDACION (<-10%)'
                ELSE 'ESTABLE / CRECIMIENTO MODERADO'
            END AS Diagnostico_Gestion
        FROM AP_LECTURAS l25
        INNER JOIN AP_LECTURAS l26
            ON l25.Sector = l26.Sector
            AND l25.Cuenta = l26.Cuenta
            AND l25.ClaveCatastral = l26.ClaveCatastral
            AND (
                (l25.mesnum IS NOT NULL AND l26.mesnum IS NOT NULL AND l25.mesnum = l26.mesnum)
                OR (UPPER(RTRIM(l25.Mes)) = UPPER(RTRIM(l26.Mes)))
            )
        WHERE l25.Anio = ${baseYear} AND l26.Anio = ${targetYear}
          AND CASE 
                WHEN l25.mesnum IS NOT NULL THEN l25.mesnum
                WHEN UPPER(RTRIM(l25.Mes)) = 'ENERO' THEN 1
                WHEN UPPER(RTRIM(l25.Mes)) = 'FEBRERO' THEN 2
                WHEN UPPER(RTRIM(l25.Mes)) = 'MARZO' THEN 3
                WHEN UPPER(RTRIM(l25.Mes)) = 'ABRIL' THEN 4
                WHEN UPPER(RTRIM(l25.Mes)) = 'MAYO' THEN 5
                WHEN UPPER(RTRIM(l25.Mes)) = 'JUNIO' THEN 6
                WHEN UPPER(RTRIM(l25.Mes)) = 'JULIO' THEN 7
                WHEN UPPER(RTRIM(l25.Mes)) = 'AGOSTO' THEN 8
                WHEN UPPER(RTRIM(l25.Mes)) = 'SEPTIEMBRE' THEN 9
                WHEN UPPER(RTRIM(l25.Mes)) = 'OCTUBRE' THEN 10
                ELSE 0 
              END BETWEEN ${startMonth} AND ${endMonth}
          ${sectorFilter}
        GROUP BY l25.Sector
        ORDER BY l25.Sector;
      `;
    } else {
      // Macro comparison by sector
      query = `
        SELECT
            ISNULL(m25.Sector, m26.Sector)                                      AS Sector,
            ISNULL(m25.Acometidas_Homologas, m26.Acometidas_Homologas)          AS Acometidas_Homologas,
            ISNULL(m25.Lecturas_2025, 0)                                        AS Lecturas_2025,
            ISNULL(m26.Lecturas_2026, 0)                                        AS Lecturas_2026,
            (ISNULL(m26.Lecturas_2026, 0) - ISNULL(m25.Lecturas_2025, 0))       AS Delta_Lecturas,
            ISNULL(m25.M3_2025, 0)                                             AS M3_2025,
            ISNULL(m26.M3_2026, 0)                                             AS M3_2026,
            (ISNULL(m26.M3_2026, 0) - ISNULL(m25.M3_2025, 0))                 AS Delta_M3,
            CAST(
                CASE 
                    WHEN ISNULL(m25.M3_2025, 0) > 0 
                    THEN ((ISNULL(m26.M3_2026, 0) - ISNULL(m25.M3_2025, 0)) * 100.0) / m25.M3_2025
                    ELSE 0.0 
                END AS DECIMAL(6,2)
            )                                                                   AS Pct_Var_M3,
            CAST(ISNULL(m25.Facturado_2025_USD, 0) AS DECIMAL(18,2))          AS Facturado_2025_USD,
            CAST(ISNULL(m26.Facturado_2026_USD, 0) AS DECIMAL(18,2))          AS Facturado_2026_USD,
            CAST((ISNULL(m26.Facturado_2026_USD, 0) - ISNULL(m25.Facturado_2025_USD, 0)) AS DECIMAL(18,2)) AS Delta_USD,
            CAST(
                CASE 
                    WHEN ISNULL(m25.Facturado_2025_USD, 0) > 0 
                    THEN ((ISNULL(m26.Facturado_2026_USD, 0) - ISNULL(m25.Facturado_2025_USD, 0)) * 100.0) / m25.Facturado_2025_USD
                    ELSE 0.0 
                END AS DECIMAL(6,2)
            )                                                                   AS Pct_Var_USD,
            CASE
                WHEN CAST(
                    CASE 
                        WHEN ISNULL(m25.Facturado_2025_USD, 0) > 0 
                        THEN ((ISNULL(m26.Facturado_2026_USD, 0) - ISNULL(m25.Facturado_2025_USD, 0)) * 100.0) / m25.Facturado_2025_USD
                        ELSE 0.0 
                    END AS DECIMAL(6,2)) > 15.0 THEN 'ALTA RECUPERACION (>+15%)'
                WHEN CAST(
                    CASE 
                        WHEN ISNULL(m25.Facturado_2025_USD, 0) > 0 
                        THEN ((ISNULL(m26.Facturado_2026_USD, 0) - ISNULL(m25.Facturado_2025_USD, 0)) * 100.0) / m25.Facturado_2025_USD
                        ELSE 0.0 
                    END AS DECIMAL(6,2)) < -10.0 THEN 'CAIDA RECAUDACION (<-10%)'
                ELSE 'ESTABLE / CRECIMIENTO MODERADO'
            END                                                                 AS Diagnostico_Gestion
        FROM 
            (
                SELECT
                    Sector,
                    COUNT(DISTINCT Cuenta)                                      AS Acometidas_Homologas,
                    COUNT(*)                                                    AS Lecturas_2025,
                    SUM(CASE WHEN LecturaActual >= LecturaAnterior THEN (LecturaActual - LecturaAnterior) ELSE 0 END) AS M3_2025,
                    SUM(ISNULL(ValorAPagar, 0) + ISNULL(TasaAlcantarillado, 0)) AS Facturado_2025_USD
                FROM AP_LECTURAS
                WHERE Anio = ${baseYear} 
                  AND CASE 
                        WHEN mesnum IS NOT NULL THEN mesnum
                        WHEN UPPER(RTRIM(Mes)) = 'ENERO' THEN 1
                        WHEN UPPER(RTRIM(Mes)) = 'FEBRERO' THEN 2
                        WHEN UPPER(RTRIM(Mes)) = 'MARZO' THEN 3
                        WHEN UPPER(RTRIM(Mes)) = 'ABRIL' THEN 4
                        WHEN UPPER(RTRIM(Mes)) = 'MAYO' THEN 5
                        WHEN UPPER(RTRIM(Mes)) = 'JUNIO' THEN 6
                        WHEN UPPER(RTRIM(Mes)) = 'JULIO' THEN 7
                        WHEN UPPER(RTRIM(Mes)) = 'AGOSTO' THEN 8
                        WHEN UPPER(RTRIM(Mes)) = 'SEPTIEMBRE' THEN 9
                        WHEN UPPER(RTRIM(Mes)) = 'OCTUBRE' THEN 10
                        ELSE 0 
                      END BETWEEN ${startMonth} AND ${endMonth}
                GROUP BY Sector
            ) m25
            FULL OUTER JOIN
            (
                SELECT
                    Sector,
                    COUNT(DISTINCT Cuenta)                                      AS Acometidas_Homologas,
                    COUNT(*)                                                    AS Lecturas_2026,
                    SUM(CASE WHEN LecturaActual >= LecturaAnterior THEN (LecturaActual - LecturaAnterior) ELSE 0 END) AS M3_2026,
                    SUM(
                        CASE 
                            WHEN ISNULL(valor_consumo_agua, 0) + ISNULL(valor_tasa_alcantarillado, 0) > 0 
                                THEN ISNULL(valor_consumo_agua, 0) + ISNULL(valor_tasa_alcantarillado, 0)
                            ELSE ISNULL(ValorAPagar, 0) + ISNULL(TasaAlcantarillado, 0)
                        END
                    )                                                           AS Facturado_2026_USD
                FROM AP_LECTURAS
                WHERE Anio = ${targetYear} 
                  AND CASE 
                        WHEN mesnum IS NOT NULL THEN mesnum
                        WHEN UPPER(RTRIM(Mes)) = 'ENERO' THEN 1
                        WHEN UPPER(RTRIM(Mes)) = 'FEBRERO' THEN 2
                        WHEN UPPER(RTRIM(Mes)) = 'MARZO' THEN 3
                        WHEN UPPER(RTRIM(Mes)) = 'ABRIL' THEN 4
                        WHEN UPPER(RTRIM(Mes)) = 'MAYO' THEN 5
                        WHEN UPPER(RTRIM(Mes)) = 'JUNIO' THEN 6
                        WHEN UPPER(RTRIM(Mes)) = 'JULIO' THEN 7
                        WHEN UPPER(RTRIM(Mes)) = 'AGOSTO' THEN 8
                        WHEN UPPER(RTRIM(Mes)) = 'SEPTIEMBRE' THEN 9
                        WHEN UPPER(RTRIM(Mes)) = 'OCTUBRE' THEN 10
                        ELSE 0 
                      END BETWEEN ${startMonth} AND ${endMonth}
                GROUP BY Sector
            ) m26 ON m25.Sector = m26.Sector
        WHERE 1 = 1
        ${sectorFilter ? sectorFilter.replace('l25.Sector', 'ISNULL(m25.Sector, m26.Sector)') : ''}
        ORDER BY ISNULL(m25.Sector, m26.Sector);
      `;
    }

    const results =
      await this.databaseService.query<LegacyInterannualComparisonSqlResult>(query);

    return LegacyAnalyticsSQLAdapter.toInterannualComparisonModelList(results);
  }
}
