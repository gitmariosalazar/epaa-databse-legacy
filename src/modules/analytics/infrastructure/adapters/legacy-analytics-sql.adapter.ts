import { LegacyExecutiveDashboardModel } from '../../domain/schemas/model/legacy-executive-dashboard.model';
import { LegacySectorPerformanceModel } from '../../domain/schemas/model/legacy-sector-performance.model';
import { LegacyMonthlyTrendModel } from '../../domain/schemas/model/legacy-monthly-trend.model';
import { LegacyNoveltyEconomicImpactModel } from '../../domain/schemas/model/legacy-novelty-economic-impact.model';
import { LegacyTopConsumerModel } from '../../domain/schemas/model/legacy-top-consumer.model';
import { LegacyInterannualComparisonModel } from '../../domain/schemas/model/legacy-interannual-comparison.model';
import { LegacyMonthlyConnectionGrowthModel } from '../../domain/schemas/model/legacy-monthly-connection-growth.model';

import {
  LegacyExecutiveDashboardSqlResult,
  LegacySectorPerformanceSqlResult,
  LegacyMonthlyTrendSqlResult,
  LegacyNoveltyEconomicImpactSqlResult,
  LegacyTopConsumerSqlResult,
  LegacyInterannualComparisonSqlResult,
  LegacyMonthlyConnectionGrowthSqlResult,
} from '../interfaces/sql/legacy-analytics-sql.interface';

function parseNumber(value: string | number | null | undefined, defaultValue = 0): number {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'number') return isNaN(value) ? defaultValue : value;
  const parsed = parseFloat(String(value).trim());
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseNullableNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  const str = String(value).trim();
  if (str === '') return null;
  const parsed = parseFloat(str);
  return isNaN(parsed) ? null : parsed;
}

export class LegacyAnalyticsSQLAdapter {
  static parseNumber = parseNumber;
  static parseNullableNumber = parseNullableNumber;

  static toExecutiveDashboardModel(
    sqlResult: LegacyExecutiveDashboardSqlResult,
  ): LegacyExecutiveDashboardModel {
    return new LegacyExecutiveDashboardModel(
      parseNumber(sqlResult.PeriodoAnio, 2026),
      sqlResult.PeriodoMes ?? '',
      parseNumber(sqlResult.TotalLecturasTomadas),
      parseNumber(sqlResult.TotalSectoresCubiertos),
      parseNumber(sqlResult.TotalAcometidasActivas),
      parseNumber(sqlResult.VolumenTotal_M3),
      parseNumber(sqlResult.ConsumoPromedioPorCuenta_M3),
      parseNumber(sqlResult.ConsumoMinimo_M3),
      parseNumber(sqlResult.ConsumoMaximo_M3),
      parseNumber(sqlResult.RecaudacionAgua_USD),
      parseNumber(sqlResult.RecaudacionAlcantarillado_USD),
      parseNumber(sqlResult.FacturacionTotal_USD ?? sqlResult.FacturacionTotalEpaa_USD),
      parseNumber(sqlResult.TicketPromedioPorCuenta_USD),
      parseNumber(sqlResult.TarifaEfectivaMedia_USD_M3),
      parseNumber(sqlResult.TotalLecturasConNovedad),
      parseNumber(sqlResult.PorcentajeNovedadOperativa),
      parseNullableNumber(sqlResult.TotalTitulo) ?? undefined,
      parseNullableNumber(sqlResult.TotalTasaBasura) ?? undefined,
      parseNullableNumber(sqlResult.TotalTerceros) ?? undefined,
      parseNullableNumber(sqlResult.TotalInteres) ?? undefined,
      parseNullableNumber(sqlResult.TotalRecargos) ?? undefined,
      parseNullableNumber(sqlResult.FacturacionTotalEpaa_USD ?? sqlResult.FacturacionTotal_USD) ?? undefined,
      parseNullableNumber(sqlResult.TotalInteresMejoras) ?? undefined,
      parseNullableNumber(sqlResult.TotalAguaPagada_USD) ?? undefined,
      parseNullableNumber(sqlResult.TotalAguaImpaga_USD) ?? undefined,
      parseNullableNumber(sqlResult.TotalFacturasGeneradas) ?? undefined,
      parseNullableNumber(sqlResult.TotalFacturasPagadas) ?? undefined,
      parseNullableNumber(sqlResult.TotalFacturasImpagas) ?? undefined,
      parseNullableNumber(sqlResult.TotalFacturasVencidas) ?? undefined,
      parseNullableNumber(sqlResult.TotalFacturasPorVencer) ?? undefined,
      parseNullableNumber(sqlResult.TotalFacturasAnuladas) ?? undefined,
      parseNullableNumber(sqlResult.TotalGeneralEmision_USD) ?? undefined,
      parseNullableNumber(sqlResult.TotalRecaudado_USD) ?? undefined,
      parseNullableNumber(sqlResult.TotalPendiente_USD) ?? undefined,
      parseNullableNumber(sqlResult.TotalVencidoMora_USD) ?? undefined,
      parseNullableNumber(sqlResult.TotalPorVencer_USD) ?? undefined,
      parseNullableNumber(sqlResult.TotalAnulado_USD) ?? undefined,
    );
  }

  static toSectorPerformanceModelList(
    rows: LegacySectorPerformanceSqlResult[],
  ): LegacySectorPerformanceModel[] {
    const totalRevenue = rows.reduce(
      (sum, r) => sum + parseNumber(r.TotalFacturado_USD),
      0,
    );
    const totalVolume = rows.reduce(
      (sum, r) => sum + parseNumber(r.M3_Consumidos),
      0,
    );

    const sortedByRevenue = [...rows].sort(
      (a, b) => parseNumber(b.TotalFacturado_USD) - parseNumber(a.TotalFacturado_USD),
    );
    const sortedByVolume = [...rows].sort(
      (a, b) => parseNumber(b.M3_Consumidos) - parseNumber(a.M3_Consumidos),
    );

    const revenueRankMap = new Map<string | number, number>();
    sortedByRevenue.forEach((r, idx) => revenueRankMap.set(r.Sector, idx + 1));

    const volumeRankMap = new Map<string | number, number>();
    sortedByVolume.forEach((r, idx) => volumeRankMap.set(r.Sector, idx + 1));

    return rows.map((r) => {
      const sector = parseNumber(r.Sector);
      const readings = parseNumber(r.TotalLecturas);
      const consumedVolume = parseNumber(r.M3_Consumidos);
      const avgConsumption = parseNumber(r.ConsumoPromedio_M3);
      const waterBilled = parseNumber(r.TotalAgua_USD);
      const sewerBilled = parseNumber(r.TotalAlcantarillado_USD);
      const totalBilled = parseNumber(r.TotalFacturado_USD);
      const novelties = parseNumber(r.CasosConNovedad);

      const revenueShare =
        r.PctAporteIngresos !== undefined
          ? parseNumber(r.PctAporteIngresos)
          : totalRevenue > 0
            ? Math.round((totalBilled / totalRevenue) * 10000) / 100
            : 0;

      const volumeShare =
        r.PctAporteVolumen_M3 !== undefined
          ? parseNumber(r.PctAporteVolumen_M3)
          : totalVolume > 0
            ? Math.round((consumedVolume / totalVolume) * 10000) / 100
            : 0;

      const avgTariff =
        parseNumber(r.TarifaEfectiva_USD_M3) ||
        (consumedVolume > 0 ? Math.round((waterBilled / consumedVolume) * 10000) / 10000 : 0);

      const noveltyPct =
        r.PctIncidencias !== undefined
          ? parseNumber(r.PctIncidencias)
          : readings > 0
            ? Math.round((novelties / readings) * 10000) / 100
            : 0;

      const revRank =
        r.RankRecaudacion !== undefined
          ? parseNumber(r.RankRecaudacion)
          : (revenueRankMap.get(r.Sector) ?? 1);

      const volRank =
        r.RankConsumoM3 !== undefined
          ? parseNumber(r.RankConsumoM3)
          : (volumeRankMap.get(r.Sector) ?? 1);

      return new LegacySectorPerformanceModel(
        sector,
        readings,
        consumedVolume,
        avgConsumption,
        waterBilled,
        sewerBilled,
        totalBilled,
        revenueShare,
        volumeShare,
        avgTariff,
        novelties,
        noveltyPct,
        revRank,
        volRank,
        parseNullableNumber(r.TotalTitulo_USD) ?? undefined,
        parseNullableNumber(r.TotalTasaBasura_USD) ?? undefined,
        parseNullableNumber(r.TotalTerceros_USD) ?? undefined,
        parseNullableNumber(r.TotalInteres_USD) ?? undefined,
        parseNullableNumber(r.TotalRecargo_USD) ?? undefined,
        parseNullableNumber(r.FacturacionTotalEpaa_USD ?? r.TotalFacturado_USD) ?? undefined,
        parseNullableNumber(r.TotalInteresMejoras_USD) ?? undefined,
        parseNullableNumber(r.TotalRecaudado_USD) ?? undefined,
        parseNullableNumber(r.TotalPendiente_USD) ?? undefined,
        parseNullableNumber(r.TotalVencidoMora_USD) ?? undefined,
        parseNullableNumber(r.TotalPorVencer_USD) ?? undefined,
        parseNullableNumber(r.TotalAnulado_USD) ?? undefined,
        parseNullableNumber(r.FacturasPagadas) ?? undefined,
        parseNullableNumber(r.FacturasPendientes) ?? undefined,
        parseNullableNumber(r.FacturasVencidas) ?? undefined,
      );
    });
  }

  static toMonthlyTrendModelList(
    rows: LegacyMonthlyTrendSqlResult[],
  ): LegacyMonthlyTrendModel[] {
    let previousVolume: number | null = null;
    let previousRevenue: number | null = null;

    return rows.map((r) => {
      const year = parseNumber(r.Anio, 2026);
      const monthNum = parseNumber(r.MesNumero);
      const totalReadings = parseNumber(r.TotalLecturas);
      const totalVolume = parseNumber(r.VolumenTotal_M3);
      const waterBilled = parseNumber(r.IngresoAgua_USD);
      const sewerBilled = parseNumber(r.IngresoAlcantarillado_USD);
      const totalBilled = parseNumber(r.IngresoTotal_USD);

      let deltaVol = parseNullableNumber(r.DeltaVolumen_M3);
      let pctGrowthVol = parseNullableNumber(r.PctCrecimiento_M3);
      let deltaRev = parseNullableNumber(r.DeltaIngresos_USD);
      let pctGrowthRev = parseNullableNumber(r.PctCrecimiento_Ingresos);

      if (deltaVol === null && previousVolume !== null) {
        deltaVol = totalVolume - previousVolume;
        pctGrowthVol =
          previousVolume > 0
            ? Math.round(((totalVolume - previousVolume) / previousVolume) * 10000) / 100
            : 0;
      }

      if (deltaRev === null && previousRevenue !== null) {
        deltaRev = Math.round((totalBilled - previousRevenue) * 100) / 100;
        pctGrowthRev =
          previousRevenue > 0
            ? Math.round(((totalBilled - previousRevenue) / previousRevenue) * 10000) / 100
            : 0;
      }

      previousVolume = totalVolume;
      previousRevenue = totalBilled;

      return new LegacyMonthlyTrendModel(
        year,
        monthNum,
        r.NombreMes ?? '',
        totalReadings,
        totalVolume,
        deltaVol,
        pctGrowthVol,
        waterBilled,
        sewerBilled,
        totalBilled,
        deltaRev,
        pctGrowthRev,
        parseNullableNumber(r.TotalTitulo_USD) ?? undefined,
        parseNullableNumber(r.TotalTasaBasura_USD) ?? undefined,
        parseNullableNumber(r.TotalTerceros_USD) ?? undefined,
        parseNullableNumber(r.TotalInteres_USD) ?? undefined,
        parseNullableNumber(r.TotalRecargo_USD) ?? undefined,
        parseNullableNumber(r.FacturacionTotalEpaa_USD ?? r.IngresoTotal_USD) ?? undefined,
        parseNullableNumber(r.TotalInteresMejoras_USD) ?? undefined,
        parseNullableNumber(r.TotalRecaudado_USD) ?? undefined,
        parseNullableNumber(r.TotalPendiente_USD) ?? undefined,
        parseNullableNumber(r.TotalVencidoMora_USD) ?? undefined,
        parseNullableNumber(r.TotalPorVencer_USD) ?? undefined,
        parseNullableNumber(r.TotalAnulado_USD) ?? undefined,
        parseNullableNumber(r.FacturasPagadas) ?? undefined,
        parseNullableNumber(r.FacturasPendientes) ?? undefined,
        parseNullableNumber(r.FacturasVencidas) ?? undefined,
      );
    });
  }

  static toNoveltyEconomicImpactModelList(
    rows: LegacyNoveltyEconomicImpactSqlResult[],
  ): LegacyNoveltyEconomicImpactModel[] {
    const totalCases = rows.reduce(
      (sum, r) => sum + parseNumber(r.TotalCasos),
      0,
    );

    return rows.map((r) => {
      const cases = parseNumber(r.TotalCasos);
      const sharePct =
        r.PctDelTotal !== undefined
          ? parseNumber(r.PctDelTotal)
          : totalCases > 0
            ? Math.round((cases / totalCases) * 10000) / 100
            : 0;

      return new LegacyNoveltyEconomicImpactModel(
        r.Novedad ?? 'SIN NOVEDAD',
        cases,
        sharePct,
        parseNumber(r.Volumen_M3),
        parseNumber(r.Promedio_M3),
        parseNumber(r.TotalAgua_USD),
        parseNumber(r.TotalAlcantarillado_USD),
        parseNumber(r.TotalRecaudado_USD),
        parseNullableNumber(r.TotalTitulo_USD) ?? undefined,
        parseNullableNumber(r.TotalTasaBasura_USD) ?? undefined,
        parseNullableNumber(r.TotalTerceros_USD) ?? undefined,
        parseNullableNumber(r.TotalInteres_USD) ?? undefined,
        parseNullableNumber(r.TotalRecargo_USD) ?? undefined,
        parseNullableNumber(r.FacturacionTotalEpaa_USD ?? r.TotalRecaudado_USD) ?? undefined,
        parseNullableNumber(r.TotalInteresMejoras_USD) ?? undefined,
        parseNullableNumber(r.TotalCobrado_USD ?? r.TotalRecaudado_USD) ?? undefined,
        parseNullableNumber(r.TotalPendiente_USD) ?? undefined,
        parseNullableNumber(r.TotalVencidoMora_USD) ?? undefined,
        parseNullableNumber(r.CasosPagados) ?? undefined,
        parseNullableNumber(r.CasosPendientes) ?? undefined,
      );
    });
  }

  static toTopConsumerModel(
    r: LegacyTopConsumerSqlResult,
  ): LegacyTopConsumerModel {
    const dateStr =
      r.FechaCaptura instanceof Date
        ? r.FechaCaptura.toISOString()
        : String(r.FechaCaptura ?? '');

    const paymentDateStr =
      r.FechaPago instanceof Date
        ? r.FechaPago.toISOString()
        : r.FechaPago
          ? String(r.FechaPago)
          : null;

    const expirationDateStr =
      r.FechaVencimiento instanceof Date
        ? r.FechaVencimiento.toISOString()
        : r.FechaVencimiento
          ? String(r.FechaVencimiento)
          : null;

    return new LegacyTopConsumerModel(
      String(r.LecturaId ?? ''),
      parseNumber(r.Sector),
      parseNumber(r.Cuenta),
      r.ClaveCatastral ?? '',
      r.NumeroDeMedidor ?? '',
      r.Direccion ?? '',
      r.Cliente ?? 'PROPIETARIO NO REGISTRADO',
      parseNumber(r.LecturaAnterior),
      parseNumber(r.LecturaActual),
      parseNumber(r.M3_Consumidos),
      parseNumber(r.ValorAgua_USD),
      parseNumber(r.ValorAlcantarillado_USD),
      parseNumber(r.TotalFacturado_USD),
      r.Novedad ?? 'NORMAL',
      dateStr,
      parseNullableNumber(r.Latitud),
      parseNullableNumber(r.Longitud),
      parseNullableNumber(r.ValorTitulo_USD) ?? undefined,
      parseNullableNumber(r.TasaBasura_USD) ?? undefined,
      parseNullableNumber(r.ValorTerceros_USD) ?? undefined,
      parseNullableNumber(r.Interes_USD) ?? undefined,
      parseNullableNumber(r.Recargo_USD) ?? undefined,
      parseNullableNumber(r.FacturacionTotalEpaa_USD ?? r.TotalFacturado_USD) ?? undefined,
      paymentDateStr,
      expirationDateStr,
      r.EstadoPago ?? (r.FechaPago ? 'PAGADO' : 'PENDIENTE'),
      parseNullableNumber(r.InteresMejoras_USD) ?? undefined,
      parseNullableNumber(r.ValorTotalPagado_USD) ?? undefined,
      parseNullableNumber(r.ValorTotalPendiente_USD) ?? undefined,
    );
  }

  static toTopConsumerModelList(
    rows: LegacyTopConsumerSqlResult[],
  ): LegacyTopConsumerModel[] {
    return rows.map((r) => LegacyAnalyticsSQLAdapter.toTopConsumerModel(r));
  }

  static toInterannualComparisonModel(
    r: LegacyInterannualComparisonSqlResult,
  ): LegacyInterannualComparisonModel {
    return new LegacyInterannualComparisonModel(
      parseNumber(r.Sector),
      parseNumber(r.Acometidas_Homologas),
      parseNumber(r.Lecturas_2025),
      parseNumber(r.Lecturas_2026),
      parseNumber(r.Delta_Lecturas),
      parseNumber(r.M3_2025),
      parseNumber(r.M3_2026),
      parseNumber(r.Delta_M3),
      parseNumber(r.Pct_Var_M3),
      parseNumber(r.Facturado_2025_USD),
      parseNumber(r.Facturado_2026_USD),
      parseNumber(r.Delta_USD),
      parseNumber(r.Pct_Var_USD),
      r.Diagnostico_Gestion ?? '',
      parseNullableNumber(r.Titulo_2025_USD) ?? undefined,
      parseNullableNumber(r.Titulo_2026_USD) ?? undefined,
      parseNullableNumber(r.Interes_2025_USD) ?? undefined,
      parseNullableNumber(r.Interes_2026_USD) ?? undefined,
      parseNullableNumber(r.Recargo_2025_USD) ?? undefined,
      parseNullableNumber(r.Recargo_2026_USD) ?? undefined,
      parseNullableNumber(r.Recaudado_2025_USD) ?? undefined,
      parseNullableNumber(r.Recaudado_2026_USD) ?? undefined,
      parseNullableNumber(r.Delta_Recaudado_USD) ?? undefined,
      parseNullableNumber(r.Pendiente_2025_USD) ?? undefined,
      parseNullableNumber(r.Pendiente_2026_USD) ?? undefined,
      parseNullableNumber(r.Delta_Pendiente_USD) ?? undefined,
      parseNullableNumber(r.VencidoMora_2025_USD) ?? undefined,
      parseNullableNumber(r.VencidoMora_2026_USD) ?? undefined,
      parseNullableNumber(r.InteresMejoras_2025_USD) ?? undefined,
      parseNullableNumber(r.InteresMejoras_2026_USD) ?? undefined,
    );
  }

  static toInterannualComparisonModelList(
    rows: LegacyInterannualComparisonSqlResult[],
  ): LegacyInterannualComparisonModel[] {
    return rows.map((r) => LegacyAnalyticsSQLAdapter.toInterannualComparisonModel(r));
  }

  static toMonthlyConnectionGrowthModel(
    r: LegacyMonthlyConnectionGrowthSqlResult,
  ): LegacyMonthlyConnectionGrowthModel {
    return new LegacyMonthlyConnectionGrowthModel(
      parseNumber(r.MesNumero),
      String(r.NombreMes ?? '').trim(),
      parseNumber(r.Acometidas_2025),
      parseNumber(r.Aumento_Mes_2025),
      parseNumber(r.Acometidas_2026),
      parseNumber(r.Aumento_Mes_2026),
      parseNumber(r.Dif_2026_vs_2025),
      parseNumber(r.Pct_Var_Interanual),
      String(r.Estado_2026 ?? '').trim(),
    );
  }

  static toMonthlyConnectionGrowthModelList(
    rows: LegacyMonthlyConnectionGrowthSqlResult[],
  ): LegacyMonthlyConnectionGrowthModel[] {
    return rows.map((r) => LegacyAnalyticsSQLAdapter.toMonthlyConnectionGrowthModel(r));
  }
}
