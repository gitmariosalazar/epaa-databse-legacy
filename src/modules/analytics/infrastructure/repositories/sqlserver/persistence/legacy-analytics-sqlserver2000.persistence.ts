import { Injectable, Logger } from '@nestjs/common';
import {
  InterfaceLegacyAnalyticsRepository,
  LegacyExecutiveDashboardFilter,
  LegacySectorPerformanceFilter,
  LegacyMonthlyTrendFilter,
  LegacyNoveltyEconomicImpactFilter,
  LegacyTopConsumersFilter,
  LegacyInterannualComparisonFilter,
  LegacyMonthlyConnectionGrowthFilter,
  LegacyAnnualTrendFilter,
} from '../../../../domain/contracts/legacy-analytics.interface.repository';
import { LegacyExecutiveDashboardModel } from '../../../../domain/schemas/model/legacy-executive-dashboard.model';
import { LegacySectorPerformanceModel } from '../../../../domain/schemas/model/legacy-sector-performance.model';
import { LegacyMonthlyTrendModel } from '../../../../domain/schemas/model/legacy-monthly-trend.model';
import { LegacyNoveltyEconomicImpactModel } from '../../../../domain/schemas/model/legacy-novelty-economic-impact.model';
import { LegacyTopConsumerModel } from '../../../../domain/schemas/model/legacy-top-consumer.model';
import { LegacyInterannualComparisonModel } from '../../../../domain/schemas/model/legacy-interannual-comparison.model';
import { LegacyMonthlyConnectionGrowthModel } from '../../../../domain/schemas/model/legacy-monthly-connection-growth.model';
import { LegacyAnnualTrendModel } from '../../../../domain/schemas/model/legacy-annual-trend.model';

import {
  LegacyExecutiveDashboardSqlResult,
  LegacySectorPerformanceSqlResult,
  LegacyMonthlyTrendSqlResult,
  LegacyNoveltyEconomicImpactSqlResult,
  LegacyTopConsumerSqlResult,
  LegacyInterannualComparisonSqlResult,
  LegacyMonthlyConnectionGrowthSqlResult,
  LegacyAnnualTrendSqlResult,
} from '../../../interfaces/sql/legacy-analytics-sql.interface';
import { LegacyAnalyticsSQLAdapter } from '../../../adapters/legacy-analytics-sql.adapter';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { MONTHS, MONTHS_REVERSE } from '../../../../../../shared/consts/months';

@Injectable()
export class LegacyAnalyticsSQLServer2000Persistence implements InterfaceLegacyAnalyticsRepository {
  private readonly logger = new Logger(
    LegacyAnalyticsSQLServer2000Persistence.name,
  );

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

    const query = /*sql*/ `
      SELECT
          L.Anio                                                              AS PeriodoAnio,
          L.Mes                                                               AS PeriodoMes,
          COUNT(*)                                                            AS TotalLecturasTomadas,
          COUNT(DISTINCT L.Sector)                                            AS TotalSectoresCubiertos,
          COUNT(DISTINCT L.ClaveCatastral)                                    AS TotalAcometidasActivas,
          CAST(SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) AS DECIMAL(18,2)) AS VolumenTotal_M3,
          CAST(AVG(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN CAST((L.LecturaActual - L.LecturaAnterior) AS DECIMAL(18,2)) ELSE 0 END) AS DECIMAL(18,2)) AS ConsumoPromedioPorCuenta_M3,
          CAST(MIN(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) AS DECIMAL(18,2)) AS ConsumoMinimo_M3,
          CAST(MAX(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) AS DECIMAL(18,2)) AS ConsumoMaximo_M3,
          CAST(SUM(ISNULL(L.ValorAPagar, 0)) AS DECIMAL(18,2))                AS RecaudacionAgua_USD,
          CAST(SUM(ISNULL(L.TasaAlcantarillado, 0)) AS DECIMAL(18,2))        AS RecaudacionAlcantarillado_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0)) AS DECIMAL(18,2))              AS TotalTitulo,
          CAST(SUM(ISNULL(di.tasa_basura, 0)) AS DECIMAL(18,2))               AS TotalTasaBasura,
          CAST(SUM(ISNULL(di.ValorTerceros, 0)) AS DECIMAL(18,2))             AS TotalTerceros,
          CAST(SUM(ISNULL(int.interes_calculado, 0)) AS DECIMAL(18,2))        AS TotalInteres,
          CAST(SUM(ISNULL(di.Recargo, 0)) AS DECIMAL(18,2))                   AS TotalRecargos,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0)) AS DECIMAL(18,2)) AS FacturacionTotalEpaa_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0)) AS DECIMAL(18,2)) AS FacturacionTotal_USD,
          CAST(AVG(ISNULL(L.ValorAPagar, 0) + ISNULL(L.TasaAlcantarillado, 0)) AS DECIMAL(18,2)) AS TicketPromedioPorCuenta_USD,
          CAST(
              CASE 
                  WHEN SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) > 0 
                  THEN SUM(ISNULL(L.ValorAPagar, 0)) / 
                       SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN CAST((L.LecturaActual - L.LecturaAnterior) AS DECIMAL(18,2)) ELSE 0 END)
                  ELSE 0 
              END AS DECIMAL(18,4)
          )                                                                   AS TarifaEfectivaMedia_USD_M3,
          SUM(CASE WHEN ISNULL(L.Novedad, 'NORMAL') NOT IN ('NORMAL', 'LECTURA NORMAL') THEN 1 ELSE 0 END) AS TotalLecturasConNovedad,
          CAST(
              (SUM(CASE WHEN ISNULL(L.Novedad, 'NORMAL') NOT IN ('NORMAL', 'LECTURA NORMAL') THEN 1.0 ELSE 0.0 END) / NULLIF(COUNT(*), 0)) * 100.0 
              AS DECIMAL(5,2)
          )                                                                   AS PorcentajeNovedadOperativa,
          CAST(SUM(ISNULL(di.interes_mejoras, 0)) AS DECIMAL(18,2))          AS TotalInteresMejoras,
          CAST(SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN ISNULL(di.Valor_Titulo, 0) ELSE 0 END) AS DECIMAL(18,2)) AS TotalAguaPagada_USD,
          CAST(SUM(CASE WHEN di.Fecha_Pago IS NULL THEN ISNULL(di.Valor_Titulo, 0) ELSE 0 END) AS DECIMAL(18,2))     AS TotalAguaImpaga_USD,
          COUNT(di.Cod_Ingreso)                                               AS TotalFacturasGeneradas,
          SUM(CASE WHEN di.Cod_Ingreso IS NOT NULL AND di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END) AS TotalFacturasPagadas,
          SUM(CASE WHEN di.Cod_Ingreso IS NOT NULL AND di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS TotalFacturasImpagas,
          SUM(CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento < GETDATE() THEN 1 ELSE 0 END) AS TotalFacturasVencidas,
          SUM(CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento >= GETDATE() THEN 1 ELSE 0 END) AS TotalFacturasPorVencer,
          SUM(CASE WHEN di.Fecha_Pago IS NULL AND di.Estado_Ingreso IN ('A', 'B', '0') THEN 1 ELSE 0 END) AS TotalFacturasAnuladas,
          CAST(SUM(
              ISNULL(di.Valor_Titulo, 0) +
              ISNULL(di.tasa_basura, 0) +
              ISNULL(di.ValorTerceros, 0) +
              ISNULL(di.interes_mejoras, 0) +
              ISNULL(di.Recargo, 0) +
              ISNULL(int.interes_calculado, 0)
          ) AS DECIMAL(18,2))                                                 AS TotalGeneralEmision_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NOT NULL THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalRecaudado_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalPendiente_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento < GETDATE() THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalVencidoMora_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento >= GETDATE() THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalPorVencer_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL AND di.Estado_Ingreso IN ('A', 'B', '0') THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalAnulado_USD
      FROM AP_LECTURAS L
      INNER JOIN Datos_ingreso di ON di.Cod_Ingreso = L.CodigoIngresoARentas
      LEFT JOIN Datos_ingreso_interes_cache int ON int.Cod_Ingreso = di.Cod_Ingreso
      WHERE L.Anio = ${year} 
        AND ((L.mesnum = ${monthNum}) OR (UPPER(RTRIM(L.Mes)) = '${monthName}'))
        ${sectorFilter}
      GROUP BY L.Anio, L.Mes;
    `;

    const results =
      await this.databaseService.query<LegacyExecutiveDashboardSqlResult>(
        query,
      );

    if (results.length === 0) {
      return new LegacyExecutiveDashboardModel(
        year,
        monthName,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
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
      orderByClause = 'ORDER BY L.Sector ASC';
    }

    const query = /*sql*/ `
      SELECT
          L.Sector,
          COUNT(*)                                                            AS TotalLecturas,
          SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) AS M3_Consumidos,
          CAST(AVG(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN CAST((L.LecturaActual - L.LecturaAnterior) AS DECIMAL(18,2)) ELSE 0 END) AS DECIMAL(18,2)) AS ConsumoPromedio_M3,
          CAST(SUM(ISNULL(L.ValorAPagar, 0)) AS DECIMAL(18,2))                AS TotalAgua_USD,
          CAST(SUM(ISNULL(L.TasaAlcantarillado, 0)) AS DECIMAL(18,2))        AS TotalAlcantarillado_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0)) AS DECIMAL(18,2))              AS TotalTitulo_USD,
          CAST(SUM(ISNULL(di.tasa_basura, 0)) AS DECIMAL(18,2))               AS TotalTasaBasura_USD,
          CAST(SUM(ISNULL(di.ValorTerceros, 0)) AS DECIMAL(18,2))             AS TotalTerceros_USD,
          CAST(SUM(ISNULL(int.interes_calculado, 0)) AS DECIMAL(18,2))        AS TotalInteres_USD,
          CAST(SUM(ISNULL(di.Recargo, 0)) AS DECIMAL(18,2))                   AS TotalRecargo_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0)) AS DECIMAL(18,2)) AS FacturacionTotalEpaa_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0)) AS DECIMAL(18,2)) AS TotalFacturado_USD,
          CAST(
              CASE 
                  WHEN SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) > 0
                  THEN SUM(ISNULL(L.ValorAPagar, 0)) / 
                       SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN CAST((L.LecturaActual - L.LecturaAnterior) AS DECIMAL(18,2)) ELSE 0 END)
                  ELSE 0 
              END AS DECIMAL(10,4)
          )                                                                   AS TarifaEfectiva_USD_M3,
          SUM(CASE WHEN ISNULL(L.Novedad, 'NORMAL') NOT IN ('NORMAL', 'LECTURA NORMAL') THEN 1 ELSE 0 END) AS CasosConNovedad,
          CAST(SUM(ISNULL(di.interes_mejoras, 0)) AS DECIMAL(18,2))          AS TotalInteresMejoras_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NOT NULL THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalRecaudado_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalPendiente_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento < GETDATE() THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalVencidoMora_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento >= GETDATE() THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalPorVencer_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL AND di.Estado_Ingreso IN ('A', 'B', '0') THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalAnulado_USD,
          SUM(CASE WHEN di.Cod_Ingreso IS NOT NULL AND di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END) AS FacturasPagadas,
          SUM(CASE WHEN di.Cod_Ingreso IS NOT NULL AND di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS FacturasPendientes,
          SUM(CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento < GETDATE() THEN 1 ELSE 0 END) AS FacturasVencidas
      FROM AP_LECTURAS L
      INNER JOIN Datos_ingreso di ON di.Cod_Ingreso = L.CodigoIngresoARentas
      LEFT JOIN Datos_ingreso_interes_cache int ON int.Cod_Ingreso = di.Cod_Ingreso
      WHERE L.Anio = ${year} 
        AND ((L.mesnum = ${monthNum}) OR (UPPER(RTRIM(L.Mes)) = '${monthName}'))
        ${sectorFilter}
      GROUP BY L.Sector
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

    const query = /*sql*/ `
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
          END                                                                 AS MesNumero,
          UPPER(RTRIM(L.Mes))                                                 AS NombreMes,
          COUNT(*)                                                            AS TotalLecturas,
          SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) AS VolumenTotal_M3,
          CAST(SUM(ISNULL(L.ValorAPagar, 0)) AS DECIMAL(18,2))                AS IngresoAgua_USD,
          CAST(SUM(ISNULL(L.TasaAlcantarillado, 0)) AS DECIMAL(18,2))        AS IngresoAlcantarillado_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0)) AS DECIMAL(18,2))              AS TotalTitulo_USD,
          CAST(SUM(ISNULL(di.tasa_basura, 0)) AS DECIMAL(18,2))               AS TotalTasaBasura_USD,
          CAST(SUM(ISNULL(di.ValorTerceros, 0)) AS DECIMAL(18,2))             AS TotalTerceros_USD,
          CAST(SUM(ISNULL(int.interes_calculado, 0)) AS DECIMAL(18,2))        AS TotalInteres_USD,
          CAST(SUM(ISNULL(di.Recargo, 0)) AS DECIMAL(18,2))                   AS TotalRecargo_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0)) AS DECIMAL(18,2)) AS FacturacionTotalEpaa_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0)) AS DECIMAL(18,2)) AS IngresoTotal_USD,
          CAST(SUM(ISNULL(di.interes_mejoras, 0)) AS DECIMAL(18,2))          AS TotalInteresMejoras_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NOT NULL THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalRecaudado_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalPendiente_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento < GETDATE() THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalVencidoMora_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento >= GETDATE() THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalPorVencer_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL AND di.Estado_Ingreso IN ('A', 'B', '0') THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalAnulado_USD,
          SUM(CASE WHEN di.Cod_Ingreso IS NOT NULL AND di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END) AS FacturasPagadas,
          SUM(CASE WHEN di.Cod_Ingreso IS NOT NULL AND di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS FacturasPendientes,
          SUM(CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento < GETDATE() THEN 1 ELSE 0 END) AS FacturasVencidas
      FROM AP_LECTURAS L
      INNER JOIN Datos_ingreso di ON di.Cod_Ingreso = L.CodigoIngresoARentas
      LEFT JOIN Datos_ingreso_interes_cache int ON int.Cod_Ingreso = di.Cod_Ingreso
      WHERE L.Anio = ${year}
        AND CASE 
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
            END BETWEEN ${startMonth} AND ${endMonth}
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
      ORDER BY L.Anio ASC, MesNumero ASC;
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

    const query = /*sql*/ `
      SELECT
          ISNULL(L.Novedad, 'SIN NOVEDAD')                                    AS Novedad,
          COUNT(*)                                                            AS TotalCasos,
          SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) AS Volumen_M3,
          CAST(AVG(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN CAST((L.LecturaActual - L.LecturaAnterior) AS DECIMAL(18,2)) ELSE 0 END) AS DECIMAL(18,2)) AS Promedio_M3,
          CAST(SUM(ISNULL(L.ValorAPagar, 0)) AS DECIMAL(18,2))                AS TotalAgua_USD,
          CAST(SUM(ISNULL(L.TasaAlcantarillado, 0)) AS DECIMAL(18,2))        AS TotalAlcantarillado_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0)) AS DECIMAL(18,2))              AS TotalTitulo_USD,
          CAST(SUM(ISNULL(di.tasa_basura, 0)) AS DECIMAL(18,2))               AS TotalTasaBasura_USD,
          CAST(SUM(ISNULL(di.ValorTerceros, 0)) AS DECIMAL(18,2))             AS TotalTerceros_USD,
          CAST(SUM(ISNULL(int.interes_calculado, 0)) AS DECIMAL(18,2))        AS TotalInteres_USD,
          CAST(SUM(ISNULL(di.Recargo, 0)) AS DECIMAL(18,2))                   AS TotalRecargo_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0)) AS DECIMAL(18,2)) AS FacturacionTotalEpaa_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0)) AS DECIMAL(18,2)) AS TotalRecaudado_USD,
          CAST(SUM(ISNULL(di.interes_mejoras, 0)) AS DECIMAL(18,2))          AS TotalInteresMejoras_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NOT NULL THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalCobrado_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalPendiente_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento < GETDATE() THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalVencidoMora_USD,
          SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END)         AS CasosPagados,
          SUM(CASE WHEN di.Fecha_Pago IS NULL THEN 1 ELSE 0 END)             AS CasosPendientes
      FROM AP_LECTURAS L
      INNER JOIN Datos_ingreso di ON di.Cod_Ingreso = L.CodigoIngresoARentas
      LEFT JOIN Datos_ingreso_interes_cache int ON int.Cod_Ingreso = di.Cod_Ingreso
      WHERE L.Anio = ${year} 
        AND ((L.mesnum = ${monthNum}) OR (UPPER(RTRIM(L.Mes)) = '${monthName}'))
        ${sectorFilter}
      GROUP BY L.Novedad
      ORDER BY TotalCasos DESC;
    `;

    const results =
      await this.databaseService.query<LegacyNoveltyEconomicImpactSqlResult>(
        query,
      );

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

    if (
      filter.minConsumptionM3 !== undefined &&
      filter.minConsumptionM3 !== null
    ) {
      dynamicFilter += ` AND (L.LecturaActual - L.LecturaAnterior) >= ${Number(filter.minConsumptionM3)}`;
    }

    if (filter.novelty) {
      const cleanNovelty = filter.novelty.replace(/'/g, "''");
      dynamicFilter += ` AND L.Novedad = '${cleanNovelty}'`;
    }

    const query = /*sql*/ `
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
          CAST(ISNULL(L.ValorAPagar, 0) AS DECIMAL(18,2))                     AS ValorAgua_USD,
          CAST(ISNULL(L.TasaAlcantarillado, 0) AS DECIMAL(18,2))              AS ValorAlcantarillado_USD,
          CAST(ISNULL(di.Valor_Titulo, 0) AS DECIMAL(18,2))                   AS ValorTitulo_USD,
          CAST(ISNULL(di.tasa_basura, 0) AS DECIMAL(18,2))                    AS TasaBasura_USD,
          CAST(ISNULL(di.ValorTerceros, 0) AS DECIMAL(18,2))                  AS ValorTerceros_USD,
          CAST(ISNULL(int.interes_calculado, 0) AS DECIMAL(18,2))             AS Interes_USD,
          CAST(ISNULL(di.Recargo, 0) AS DECIMAL(18,2))                        AS Recargo_USD,
          CAST(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0) AS DECIMAL(18,2)) AS FacturacionTotalEpaa_USD,
          CAST(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0) AS DECIMAL(18,2)) AS TotalFacturado_USD,
          ISNULL(L.Novedad, 'NORMAL')                                         AS Novedad,
          L.FechaCaptura,
          A.Latitud,
          A.Longitud,
          di.Fecha_Pago                                                       AS FechaPago,
          di.Fecha_Vencimiento                                                AS FechaVencimiento,
          CASE 
              WHEN di.Fecha_Pago IS NOT NULL THEN 'PAGADO'
              WHEN di.Fecha_Vencimiento < GETDATE() THEN 'VENCIDO / MORA'
              ELSE 'POR VENCER'
          END                                                                 AS EstadoPago,
          CAST(ISNULL(di.interes_mejoras, 0) AS DECIMAL(18,2))               AS InteresMejoras_USD,
          CAST(
              CASE WHEN di.Fecha_Pago IS NOT NULL THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          AS DECIMAL(18,2))                                                   AS ValorTotalPagado_USD,
          CAST(
              CASE WHEN di.Fecha_Pago IS NULL THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          AS DECIMAL(18,2))                                                   AS ValorTotalPendiente_USD
      FROM AP_LECTURAS L
      INNER JOIN Datos_ingreso di ON di.Cod_Ingreso = L.CodigoIngresoARentas
      LEFT JOIN Datos_ingreso_interes_cache int ON int.Cod_Ingreso = di.Cod_Ingreso
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
      query = /*sql*/ `
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
            CAST(SUM(ISNULL(di25.Valor_Titulo, 0) + ISNULL(int25.interes_calculado, 0) + ISNULL(di25.Recargo, 0)) AS DECIMAL(18,2)) AS Facturado_2025_USD,
            CAST(SUM(ISNULL(di26.Valor_Titulo, 0) + ISNULL(int26.interes_calculado, 0) + ISNULL(di26.Recargo, 0)) AS DECIMAL(18,2)) AS Facturado_2026_USD,
            CAST(SUM(ISNULL(di25.Valor_Titulo, 0)) AS DECIMAL(18,2))           AS Titulo_2025_USD,
            CAST(SUM(ISNULL(di26.Valor_Titulo, 0)) AS DECIMAL(18,2))           AS Titulo_2026_USD,
            CAST(SUM(ISNULL(int25.interes_calculado, 0)) AS DECIMAL(18,2))     AS Interes_2025_USD,
            CAST(SUM(ISNULL(int26.interes_calculado, 0)) AS DECIMAL(18,2))     AS Interes_2026_USD,
            CAST(SUM(ISNULL(di25.Recargo, 0)) AS DECIMAL(18,2))                AS Recargo_2025_USD,
            CAST(SUM(ISNULL(di26.Recargo, 0)) AS DECIMAL(18,2))                AS Recargo_2026_USD,
            CAST(SUM(ISNULL(di25.interes_mejoras, 0)) AS DECIMAL(18,2))        AS InteresMejoras_2025_USD,
            CAST(SUM(ISNULL(di26.interes_mejoras, 0)) AS DECIMAL(18,2))        AS InteresMejoras_2026_USD,
            CAST(SUM(CASE WHEN di25.Fecha_Pago IS NOT NULL THEN (ISNULL(di25.Valor_Titulo, 0) + ISNULL(di25.tasa_basura, 0) + ISNULL(di25.ValorTerceros, 0) + ISNULL(di25.interes_mejoras, 0) + ISNULL(di25.Recargo, 0) + ISNULL(int25.interes_calculado, 0)) ELSE 0 END) AS DECIMAL(18,2)) AS Recaudado_2025_USD,
            CAST(SUM(CASE WHEN di26.Fecha_Pago IS NOT NULL THEN (ISNULL(di26.Valor_Titulo, 0) + ISNULL(di26.tasa_basura, 0) + ISNULL(di26.ValorTerceros, 0) + ISNULL(di26.interes_mejoras, 0) + ISNULL(di26.Recargo, 0) + ISNULL(int26.interes_calculado, 0)) ELSE 0 END) AS DECIMAL(18,2)) AS Recaudado_2026_USD,
            CAST((SUM(CASE WHEN di26.Fecha_Pago IS NOT NULL THEN (ISNULL(di26.Valor_Titulo, 0) + ISNULL(di26.tasa_basura, 0) + ISNULL(di26.ValorTerceros, 0) + ISNULL(di26.interes_mejoras, 0) + ISNULL(di26.Recargo, 0) + ISNULL(int26.interes_calculado, 0)) ELSE 0 END) -
                  SUM(CASE WHEN di25.Fecha_Pago IS NOT NULL THEN (ISNULL(di25.Valor_Titulo, 0) + ISNULL(di25.tasa_basura, 0) + ISNULL(di25.ValorTerceros, 0) + ISNULL(di25.interes_mejoras, 0) + ISNULL(di25.Recargo, 0) + ISNULL(int25.interes_calculado, 0)) ELSE 0 END)) AS DECIMAL(18,2)) AS Delta_Recaudado_USD,
            CAST(SUM(CASE WHEN di25.Fecha_Pago IS NULL THEN (ISNULL(di25.Valor_Titulo, 0) + ISNULL(di25.tasa_basura, 0) + ISNULL(di25.ValorTerceros, 0) + ISNULL(di25.interes_mejoras, 0) + ISNULL(di25.Recargo, 0) + ISNULL(int25.interes_calculado, 0)) ELSE 0 END) AS DECIMAL(18,2)) AS Pendiente_2025_USD,
            CAST(SUM(CASE WHEN di26.Fecha_Pago IS NULL THEN (ISNULL(di26.Valor_Titulo, 0) + ISNULL(di26.tasa_basura, 0) + ISNULL(di26.ValorTerceros, 0) + ISNULL(di26.interes_mejoras, 0) + ISNULL(di26.Recargo, 0) + ISNULL(int26.interes_calculado, 0)) ELSE 0 END) AS DECIMAL(18,2)) AS Pendiente_2026_USD,
            CAST((SUM(CASE WHEN di26.Fecha_Pago IS NULL THEN (ISNULL(di26.Valor_Titulo, 0) + ISNULL(di26.tasa_basura, 0) + ISNULL(di26.ValorTerceros, 0) + ISNULL(di26.interes_mejoras, 0) + ISNULL(di26.Recargo, 0) + ISNULL(int26.interes_calculado, 0)) ELSE 0 END) -
                  SUM(CASE WHEN di25.Fecha_Pago IS NULL THEN (ISNULL(di25.Valor_Titulo, 0) + ISNULL(di25.tasa_basura, 0) + ISNULL(di25.ValorTerceros, 0) + ISNULL(di25.interes_mejoras, 0) + ISNULL(di25.Recargo, 0) + ISNULL(int25.interes_calculado, 0)) ELSE 0 END)) AS DECIMAL(18,2)) AS Delta_Pendiente_USD,
            CAST(SUM(CASE WHEN di25.Fecha_Pago IS NULL AND di25.Fecha_Vencimiento < GETDATE() THEN (ISNULL(di25.Valor_Titulo, 0) + ISNULL(di25.tasa_basura, 0) + ISNULL(di25.ValorTerceros, 0) + ISNULL(di25.interes_mejoras, 0) + ISNULL(di25.Recargo, 0) + ISNULL(int25.interes_calculado, 0)) ELSE 0 END) AS DECIMAL(18,2)) AS VencidoMora_2025_USD,
            CAST(SUM(CASE WHEN di26.Fecha_Pago IS NULL AND di26.Fecha_Vencimiento < GETDATE() THEN (ISNULL(di26.Valor_Titulo, 0) + ISNULL(di26.tasa_basura, 0) + ISNULL(di26.ValorTerceros, 0) + ISNULL(di26.interes_mejoras, 0) + ISNULL(di26.Recargo, 0) + ISNULL(int26.interes_calculado, 0)) ELSE 0 END) AS DECIMAL(18,2)) AS VencidoMora_2026_USD,
            CAST((SUM(ISNULL(di26.Valor_Titulo, 0) + ISNULL(int26.interes_calculado, 0) + ISNULL(di26.Recargo, 0)) - SUM(ISNULL(di25.Valor_Titulo, 0) + ISNULL(int25.interes_calculado, 0) + ISNULL(di25.Recargo, 0))) AS DECIMAL(18,2)) AS Delta_USD,
            CAST(
                CASE 
                    WHEN SUM(ISNULL(di25.Valor_Titulo, 0) + ISNULL(int25.interes_calculado, 0) + ISNULL(di25.Recargo, 0)) > 0 
                    THEN ((SUM(ISNULL(di26.Valor_Titulo, 0) + ISNULL(int26.interes_calculado, 0) + ISNULL(di26.Recargo, 0)) - SUM(ISNULL(di25.Valor_Titulo, 0) + ISNULL(int25.interes_calculado, 0) + ISNULL(di25.Recargo, 0))) * 100.0) /
                          SUM(ISNULL(di25.Valor_Titulo, 0) + ISNULL(int25.interes_calculado, 0) + ISNULL(di25.Recargo, 0))
                    ELSE 0.0 
                END AS DECIMAL(6,2)
            )                                                                   AS Pct_Var_USD,
            CASE
                WHEN CAST(
                    CASE 
                        WHEN SUM(ISNULL(di25.Valor_Titulo, 0) + ISNULL(int25.interes_calculado, 0) + ISNULL(di25.Recargo, 0)) > 0 
                        THEN ((SUM(ISNULL(di26.Valor_Titulo, 0) + ISNULL(int26.interes_calculado, 0) + ISNULL(di26.Recargo, 0)) - SUM(ISNULL(di25.Valor_Titulo, 0) + ISNULL(int25.interes_calculado, 0) + ISNULL(di25.Recargo, 0))) * 100.0) /
                              SUM(ISNULL(di25.Valor_Titulo, 0) + ISNULL(int25.interes_calculado, 0) + ISNULL(di25.Recargo, 0))
                        ELSE 0.0 
                    END AS DECIMAL(6,2)) > 15.0 THEN 'ALTA RECUPERACION (>+15%)'
                WHEN CAST(
                    CASE 
                        WHEN SUM(ISNULL(di25.Valor_Titulo, 0) + ISNULL(int25.interes_calculado, 0) + ISNULL(di25.Recargo, 0)) > 0 
                        THEN ((SUM(ISNULL(di26.Valor_Titulo, 0) + ISNULL(int26.interes_calculado, 0) + ISNULL(di26.Recargo, 0)) - SUM(ISNULL(di25.Valor_Titulo, 0) + ISNULL(int25.interes_calculado, 0) + ISNULL(di25.Recargo, 0))) * 100.0) /
                              SUM(ISNULL(di25.Valor_Titulo, 0) + ISNULL(int25.interes_calculado, 0) + ISNULL(di25.Recargo, 0))
                        ELSE 0.0 
                    END AS DECIMAL(6,2)) < -10.0 THEN 'CAIDA RECAUDACION (<-10%)'
                ELSE 'ESTABLE / CRECIMIENTO MODERADO'
            END AS Diagnostico_Gestion
        FROM AP_LECTURAS l25
        INNER JOIN Datos_ingreso di25 ON di25.Cod_Ingreso = l25.CodigoIngresoARentas
        LEFT JOIN Datos_ingreso_interes_cache int25 ON int25.Cod_Ingreso = di25.Cod_Ingreso
        INNER JOIN AP_LECTURAS l26
            ON l25.Sector = l26.Sector
            AND l25.Cuenta = l26.Cuenta
            AND l25.ClaveCatastral = l26.ClaveCatastral
            AND (
                (l25.mesnum IS NOT NULL AND l26.mesnum IS NOT NULL AND l25.mesnum = l26.mesnum)
                OR (UPPER(RTRIM(l25.Mes)) = UPPER(RTRIM(l26.Mes)))
            )
        INNER JOIN Datos_ingreso di26 ON di26.Cod_Ingreso = l26.CodigoIngresoARentas
        LEFT JOIN Datos_ingreso_interes_cache int26 ON int26.Cod_Ingreso = di26.Cod_Ingreso
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
      query = /*sql*/ `
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
            CAST(ISNULL(m25.Titulo_2025_USD, 0) AS DECIMAL(18,2))             AS Titulo_2025_USD,
            CAST(ISNULL(m26.Titulo_2026_USD, 0) AS DECIMAL(18,2))             AS Titulo_2026_USD,
            CAST(ISNULL(m25.Interes_2025_USD, 0) AS DECIMAL(18,2))            AS Interes_2025_USD,
            CAST(ISNULL(m26.Interes_2026_USD, 0) AS DECIMAL(18,2))            AS Interes_2026_USD,
            CAST(ISNULL(m25.Recargo_2025_USD, 0) AS DECIMAL(18,2))            AS Recargo_2025_USD,
            CAST(ISNULL(m26.Recargo_2026_USD, 0) AS DECIMAL(18,2))            AS Recargo_2026_USD,
            CAST(ISNULL(m25.InteresMejoras_2025_USD, 0) AS DECIMAL(18,2))     AS InteresMejoras_2025_USD,
            CAST(ISNULL(m26.InteresMejoras_2026_USD, 0) AS DECIMAL(18,2))     AS InteresMejoras_2026_USD,
            CAST(ISNULL(m25.Recaudado_2025_USD, 0) AS DECIMAL(18,2))          AS Recaudado_2025_USD,
            CAST(ISNULL(m26.Recaudado_2026_USD, 0) AS DECIMAL(18,2))          AS Recaudado_2026_USD,
            CAST((ISNULL(m26.Recaudado_2026_USD, 0) - ISNULL(m25.Recaudado_2025_USD, 0)) AS DECIMAL(18,2)) AS Delta_Recaudado_USD,
            CAST(ISNULL(m25.Pendiente_2025_USD, 0) AS DECIMAL(18,2))          AS Pendiente_2025_USD,
            CAST(ISNULL(m26.Pendiente_2026_USD, 0) AS DECIMAL(18,2))          AS Pendiente_2026_USD,
            CAST((ISNULL(m26.Pendiente_2026_USD, 0) - ISNULL(m25.Pendiente_2025_USD, 0)) AS DECIMAL(18,2)) AS Delta_Pendiente_USD,
            CAST(ISNULL(m25.VencidoMora_2025_USD, 0) AS DECIMAL(18,2))        AS VencidoMora_2025_USD,
            CAST(ISNULL(m26.VencidoMora_2026_USD, 0) AS DECIMAL(18,2))        AS VencidoMora_2026_USD,
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
                    L.Sector,
                    COUNT(DISTINCT L.Cuenta)                                      AS Acometidas_Homologas,
                    COUNT(*)                                                    AS Lecturas_2025,
                    SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) AS M3_2025,
                    SUM(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0)) AS Facturado_2025_USD,
                    SUM(ISNULL(di.Valor_Titulo, 0)) AS Titulo_2025_USD,
                    SUM(ISNULL(int.interes_calculado, 0)) AS Interes_2025_USD,
                    SUM(ISNULL(di.Recargo, 0)) AS Recargo_2025_USD,
                    SUM(ISNULL(di.interes_mejoras, 0)) AS InteresMejoras_2025_USD,
                    SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN (ISNULL(di.Valor_Titulo, 0) + ISNULL(di.tasa_basura, 0) + ISNULL(di.ValorTerceros, 0) + ISNULL(di.interes_mejoras, 0) + ISNULL(di.Recargo, 0) + ISNULL(int.interes_calculado, 0)) ELSE 0 END) AS Recaudado_2025_USD,
                    SUM(CASE WHEN di.Fecha_Pago IS NULL THEN (ISNULL(di.Valor_Titulo, 0) + ISNULL(di.tasa_basura, 0) + ISNULL(di.ValorTerceros, 0) + ISNULL(di.interes_mejoras, 0) + ISNULL(di.Recargo, 0) + ISNULL(int.interes_calculado, 0)) ELSE 0 END) AS Pendiente_2025_USD,
                    SUM(CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento < GETDATE() THEN (ISNULL(di.Valor_Titulo, 0) + ISNULL(di.tasa_basura, 0) + ISNULL(di.ValorTerceros, 0) + ISNULL(di.interes_mejoras, 0) + ISNULL(di.Recargo, 0) + ISNULL(int.interes_calculado, 0)) ELSE 0 END) AS VencidoMora_2025_USD
                FROM AP_LECTURAS L
                INNER JOIN Datos_ingreso di ON di.Cod_Ingreso = L.CodigoIngresoARentas
                LEFT JOIN Datos_ingreso_interes_cache int ON int.Cod_Ingreso = di.Cod_Ingreso
                WHERE L.Anio = ${baseYear} 
                  AND CASE 
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
                        ELSE 0 
                      END BETWEEN ${startMonth} AND ${endMonth}
                GROUP BY L.Sector
            ) m25
            FULL OUTER JOIN
            (
                SELECT
                    L.Sector,
                    COUNT(DISTINCT L.Cuenta)                                      AS Acometidas_Homologas,
                    COUNT(*)                                                    AS Lecturas_2026,
                    SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) AS M3_2026,
                    SUM(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0)) AS Facturado_2026_USD,
                    SUM(ISNULL(di.Valor_Titulo, 0)) AS Titulo_2026_USD,
                    SUM(ISNULL(int.interes_calculado, 0)) AS Interes_2026_USD,
                    SUM(ISNULL(di.Recargo, 0)) AS Recargo_2026_USD,
                    SUM(ISNULL(di.interes_mejoras, 0)) AS InteresMejoras_2026_USD,
                    SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN (ISNULL(di.Valor_Titulo, 0) + ISNULL(di.tasa_basura, 0) + ISNULL(di.ValorTerceros, 0) + ISNULL(di.interes_mejoras, 0) + ISNULL(di.Recargo, 0) + ISNULL(int.interes_calculado, 0)) ELSE 0 END) AS Recaudado_2026_USD,
                    SUM(CASE WHEN di.Fecha_Pago IS NULL THEN (ISNULL(di.Valor_Titulo, 0) + ISNULL(di.tasa_basura, 0) + ISNULL(di.ValorTerceros, 0) + ISNULL(di.interes_mejoras, 0) + ISNULL(di.Recargo, 0) + ISNULL(int.interes_calculado, 0)) ELSE 0 END) AS Pendiente_2026_USD,
                    SUM(CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento < GETDATE() THEN (ISNULL(di.Valor_Titulo, 0) + ISNULL(di.tasa_basura, 0) + ISNULL(di.ValorTerceros, 0) + ISNULL(di.interes_mejoras, 0) + ISNULL(di.Recargo, 0) + ISNULL(int.interes_calculado, 0)) ELSE 0 END) AS VencidoMora_2026_USD
                FROM AP_LECTURAS L
                INNER JOIN Datos_ingreso di ON di.Cod_Ingreso = L.CodigoIngresoARentas
                LEFT JOIN Datos_ingreso_interes_cache int ON int.Cod_Ingreso = di.Cod_Ingreso
                WHERE L.Anio = ${targetYear} 
                  AND CASE 
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
                        ELSE 0 
                      END BETWEEN ${startMonth} AND ${endMonth}
                GROUP BY L.Sector
            ) m26 ON m25.Sector = m26.Sector
        WHERE 1 = 1
        ${sectorFilter ? sectorFilter.replace('l25.Sector', 'ISNULL(m25.Sector, m26.Sector)') : ''}
        ORDER BY ISNULL(m25.Sector, m26.Sector);
      `;
    }

    const results =
      await this.databaseService.query<LegacyInterannualComparisonSqlResult>(
        query,
      );

    return LegacyAnalyticsSQLAdapter.toInterannualComparisonModelList(results);
  }

  async getMonthlyConnectionGrowth(
    filter: LegacyMonthlyConnectionGrowthFilter,
  ): Promise<LegacyMonthlyConnectionGrowthModel[]> {
    const baseYear = filter.baseYear ?? 2025;
    const targetYear = filter.targetYear ?? 2026;

    const query = /*sql*/ `
      SELECT 
          m.MesNumero,
          m.NombreMes,
          
          ISNULL(act25.Total, 0) AS Acometidas_2025,
          CASE 
              WHEN ant25.Total IS NULL THEN 0 
              ELSE ISNULL(act25.Total, 0) - ant25.Total 
          END AS Aumento_Mes_2025,
          
          ISNULL(act26.Total, 0) AS Acometidas_2026,
          CASE 
              WHEN ISNULL(act26.Total, 0) = 0 THEN 0
              WHEN ant26.Total IS NULL THEN 0 
              ELSE act26.Total - ant26.Total 
          END AS Aumento_Mes_2026,
          
          CASE 
              WHEN ISNULL(act26.Total, 0) = 0 THEN 0
              ELSE act26.Total - ISNULL(act25.Total, 0)
          END AS Dif_2026_vs_2025,
          
          CAST(
              CASE 
                  WHEN ISNULL(act26.Total, 0) = 0 THEN 0.0
                  WHEN ISNULL(act25.Total, 0) > 0 
                  THEN ((act26.Total - act25.Total) * 100.0) / act25.Total
                  ELSE 0.0 
              END AS DECIMAL(6,2)
          ) AS Pct_Var_Interanual,
          
          CASE 
              WHEN ISNULL(act26.Total, 0) = 0 THEN 'NO EMITIDO'
              WHEN act26.Total < (ISNULL(act25.Total, 0) * 0.70) THEN 'EN PROCESO DE TOMA'
              ELSE 'CERRADO / FACTURADO'
          END AS Estado_2026
      FROM 
          (
              SELECT 1 AS MesNumero, 'ENERO' AS NombreMes UNION ALL
              SELECT 2, 'FEBRERO' UNION ALL
              SELECT 3, 'MARZO' UNION ALL
              SELECT 4, 'ABRIL' UNION ALL
              SELECT 5, 'MAYO' UNION ALL
              SELECT 6, 'JUNIO' UNION ALL
              SELECT 7, 'JULIO' UNION ALL
              SELECT 8, 'AGOSTO' UNION ALL
              SELECT 9, 'SEPTIEMBRE' UNION ALL
              SELECT 10, 'OCTUBRE' UNION ALL
              SELECT 11, 'NOVIEMBRE' UNION ALL
              SELECT 12, 'DICIEMBRE'
          ) m
      LEFT JOIN (
          SELECT 
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
              END AS MesNum,
              COUNT(DISTINCT L.ClaveCatastral) AS Total
          FROM AP_LECTURAS L
          INNER JOIN Datos_ingreso di ON di.Cod_Ingreso = L.CodigoIngresoARentas
          WHERE L.Anio = ${baseYear}
          GROUP BY 
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
              END
      ) act25 ON act25.MesNum = m.MesNumero
      LEFT JOIN (
          SELECT 
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
              END AS MesNum,
              COUNT(DISTINCT L.ClaveCatastral) AS Total
          FROM AP_LECTURAS L
          INNER JOIN Datos_ingreso di ON di.Cod_Ingreso = L.CodigoIngresoARentas
          WHERE L.Anio = ${baseYear}
          GROUP BY 
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
              END
      ) ant25 ON ant25.MesNum = (m.MesNumero - 1)
      LEFT JOIN (
          SELECT 
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
              END AS MesNum,
              COUNT(DISTINCT L.ClaveCatastral) AS Total
          FROM AP_LECTURAS L
          INNER JOIN Datos_ingreso di ON di.Cod_Ingreso = L.CodigoIngresoARentas
          WHERE L.Anio = ${targetYear}
          GROUP BY 
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
              END
      ) act26 ON act26.MesNum = m.MesNumero
      LEFT JOIN (
          SELECT 
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
              END AS MesNum,
              COUNT(DISTINCT L.ClaveCatastral) AS Total
          FROM AP_LECTURAS L
          INNER JOIN Datos_ingreso di ON di.Cod_Ingreso = L.CodigoIngresoARentas
          WHERE L.Anio = ${targetYear}
          GROUP BY 
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
              END
      ) ant26 ON ant26.MesNum = (m.MesNumero - 1)
      ORDER BY m.MesNumero;
    `;

    const results =
      await this.databaseService.query<LegacyMonthlyConnectionGrowthSqlResult>(
        query,
      );

    return LegacyAnalyticsSQLAdapter.toMonthlyConnectionGrowthModelList(results);
  }

  async getAnnualTrend(
    filter: LegacyAnnualTrendFilter,
  ): Promise<LegacyAnnualTrendModel[]> {
    const endYear = filter.endYear ?? 2026;
    const limitYears = filter.limitYears ?? 5;
    const startYear = filter.startYear ?? endYear - limitYears + 1;

    const sectorFilter =
      filter.sector !== undefined && filter.sector !== null
        ? `AND L.Sector = ${Number(filter.sector)}`
        : '';

    const query = /*sql*/ `
      SELECT
          L.Anio,
          COUNT(*)                                                            AS TotalLecturas,
          COUNT(DISTINCT L.ClaveCatastral)                                    AS TotalAcometidasActivas,
          SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) AS VolumenTotal_M3,
          CAST(AVG(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN CAST((L.LecturaActual - L.LecturaAnterior) AS DECIMAL(18,2)) ELSE 0 END) AS DECIMAL(18,2)) AS ConsumoPromedioPorCuenta_M3,
          CAST(SUM(ISNULL(L.ValorAPagar, 0)) AS DECIMAL(18,2))                AS IngresoAgua_USD,
          CAST(SUM(ISNULL(L.TasaAlcantarillado, 0)) AS DECIMAL(18,2))        AS IngresoAlcantarillado_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0)) AS DECIMAL(18,2))              AS TotalTitulo_USD,
          CAST(SUM(ISNULL(di.tasa_basura, 0)) AS DECIMAL(18,2))               AS TotalTasaBasura_USD,
          CAST(SUM(ISNULL(di.ValorTerceros, 0)) AS DECIMAL(18,2))             AS TotalTerceros_USD,
          CAST(SUM(ISNULL(int.interes_calculado, 0)) AS DECIMAL(18,2))        AS TotalInteres_USD,
          CAST(SUM(ISNULL(di.Recargo, 0)) AS DECIMAL(18,2))                   AS TotalRecargo_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0)) AS DECIMAL(18,2)) AS FacturacionTotalEpaa_USD,
          CAST(SUM(ISNULL(di.Valor_Titulo, 0) + ISNULL(int.interes_calculado, 0) + ISNULL(di.Recargo, 0)) AS DECIMAL(18,2)) AS IngresoTotal_USD,
          CAST(
              CASE 
                  WHEN SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN (L.LecturaActual - L.LecturaAnterior) ELSE 0 END) > 0
                  THEN SUM(ISNULL(L.ValorAPagar, 0)) / 
                       SUM(CASE WHEN L.LecturaActual >= L.LecturaAnterior THEN CAST((L.LecturaActual - L.LecturaAnterior) AS DECIMAL(18,2)) ELSE 0 END)
                  ELSE 0 
              END AS DECIMAL(10,4)
          )                                                                   AS TarifaEfectivaMedia_USD_M3,
          CAST(SUM(ISNULL(di.interes_mejoras, 0)) AS DECIMAL(18,2))          AS TotalInteresMejoras_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NOT NULL THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalRecaudado_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalPendiente_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento < GETDATE() THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalVencidoMora_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento >= GETDATE() THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalPorVencer_USD,
          CAST(SUM(
              CASE WHEN di.Fecha_Pago IS NULL AND di.Estado_Ingreso IN ('A', 'B', '0') THEN
                  ISNULL(di.Valor_Titulo, 0) +
                  ISNULL(di.tasa_basura, 0) +
                  ISNULL(di.ValorTerceros, 0) +
                  ISNULL(di.interes_mejoras, 0) +
                  ISNULL(di.Recargo, 0) +
                  ISNULL(int.interes_calculado, 0)
              ELSE 0 END
          ) AS DECIMAL(18,2))                                                 AS TotalAnulado_USD,
          SUM(CASE WHEN di.Cod_Ingreso IS NOT NULL AND di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END) AS FacturasPagadas,
          SUM(CASE WHEN di.Cod_Ingreso IS NOT NULL AND di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS FacturasPendientes,
          SUM(CASE WHEN di.Fecha_Pago IS NULL AND di.Fecha_Vencimiento < GETDATE() THEN 1 ELSE 0 END) AS FacturasVencidas
      FROM AP_LECTURAS L
      INNER JOIN Datos_ingreso di ON di.Cod_Ingreso = L.CodigoIngresoARentas
      LEFT JOIN Datos_ingreso_interes_cache int ON int.Cod_Ingreso = di.Cod_Ingreso
      WHERE L.Anio BETWEEN ${startYear} AND ${endYear}
        ${sectorFilter}
      GROUP BY L.Anio
      ORDER BY L.Anio ASC;
    `;

    const results =
      await this.databaseService.query<LegacyAnnualTrendSqlResult>(query);

    return LegacyAnalyticsSQLAdapter.toAnnualTrendModelList(results);
  }
}
