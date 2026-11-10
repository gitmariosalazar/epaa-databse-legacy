export interface LegacyExecutiveDashboardSqlResult {
  PeriodoAnio: string | number;
  PeriodoMes: string;
  TotalLecturasTomadas: string | number;
  TotalSectoresCubiertos: string | number;
  TotalAcometidasActivas: string | number;
  VolumenTotal_M3: string | number;
  ConsumoPromedioPorCuenta_M3: string | number;
  ConsumoMinimo_M3: string | number;
  ConsumoMaximo_M3: string | number;
  RecaudacionAgua_USD: string | number;
  RecaudacionAlcantarillado_USD: string | number;
  TotalTitulo?: string | number;
  TotalTasaBasura?: string | number;
  TotalTerceros?: string | number;
  TotalInteres?: string | number;
  TotalRecargos?: string | number;
  FacturacionTotalEpaa_USD?: string | number;
  FacturacionTotal_USD: string | number;
  TicketPromedioPorCuenta_USD: string | number;
  TarifaEfectivaMedia_USD_M3: string | number;
  TotalLecturasConNovedad: string | number;
  PorcentajeNovedadOperativa: string | number;
  TotalInteresMejoras?: string | number;
  TotalAguaPagada_USD?: string | number;
  TotalAguaImpaga_USD?: string | number;
  TotalFacturasGeneradas?: string | number;
  TotalFacturasPagadas?: string | number;
  TotalFacturasImpagas?: string | number;
  TotalFacturasVencidas?: string | number;
  TotalFacturasPorVencer?: string | number;
  TotalFacturasAnuladas?: string | number;
  TotalGeneralEmision_USD?: string | number;
  TotalRecaudado_USD?: string | number;
  TotalPendiente_USD?: string | number;
  TotalVencidoMora_USD?: string | number;
  TotalPorVencer_USD?: string | number;
  TotalAnulado_USD?: string | number;
}

export interface LegacySectorPerformanceSqlResult {
  Sector: string | number;
  TotalLecturas: string | number;
  M3_Consumidos: string | number;
  ConsumoPromedio_M3: string | number;
  TotalAgua_USD: string | number;
  TotalAlcantarillado_USD: string | number;
  TotalTitulo_USD?: string | number;
  TotalTasaBasura_USD?: string | number;
  TotalTerceros_USD?: string | number;
  TotalInteres_USD?: string | number;
  TotalRecargo_USD?: string | number;
  FacturacionTotalEpaa_USD?: string | number;
  TotalFacturado_USD: string | number;
  PctAporteIngresos?: string | number;
  PctAporteVolumen_M3?: string | number;
  TarifaEfectiva_USD_M3: string | number;
  CasosConNovedad: string | number;
  PctIncidencias?: string | number;
  RankRecaudacion?: string | number;
  RankConsumoM3?: string | number;
  TotalInteresMejoras_USD?: string | number;
  TotalRecaudado_USD?: string | number;
  TotalPendiente_USD?: string | number;
  TotalVencidoMora_USD?: string | number;
  TotalPorVencer_USD?: string | number;
  TotalAnulado_USD?: string | number;
  FacturasPagadas?: string | number;
  FacturasPendientes?: string | number;
  FacturasVencidas?: string | number;
}

export interface LegacyMonthlyTrendSqlResult {
  Anio: string | number;
  MesNumero: string | number;
  NombreMes: string;
  TotalLecturas: string | number;
  VolumenTotal_M3: string | number;
  DeltaVolumen_M3?: string | number | null;
  PctCrecimiento_M3?: string | number | null;
  IngresoAgua_USD: string | number;
  IngresoAlcantarillado_USD: string | number;
  TotalTitulo_USD?: string | number;
  TotalTasaBasura_USD?: string | number;
  TotalTerceros_USD?: string | number;
  TotalInteres_USD?: string | number;
  TotalRecargo_USD?: string | number;
  FacturacionTotalEpaa_USD?: string | number;
  IngresoTotal_USD: string | number;
  DeltaIngresos_USD?: string | number | null;
  PctCrecimiento_Ingresos?: string | number | null;
  TotalInteresMejoras_USD?: string | number;
  TotalRecaudado_USD?: string | number;
  TotalPendiente_USD?: string | number;
  TotalVencidoMora_USD?: string | number;
  TotalPorVencer_USD?: string | number;
  TotalAnulado_USD?: string | number;
  FacturasPagadas?: string | number;
  FacturasPendientes?: string | number;
  FacturasVencidas?: string | number;
}

export interface LegacyNoveltyEconomicImpactSqlResult {
  Novedad: string;
  TotalCasos: string | number;
  PctDelTotal?: string | number;
  Volumen_M3: string | number;
  Promedio_M3: string | number;
  TotalAgua_USD: string | number;
  TotalAlcantarillado_USD: string | number;
  TotalTitulo_USD?: string | number;
  TotalTasaBasura_USD?: string | number;
  TotalTerceros_USD?: string | number;
  TotalInteres_USD?: string | number;
  TotalRecargo_USD?: string | number;
  FacturacionTotalEpaa_USD?: string | number;
  TotalRecaudado_USD: string | number;
  TotalInteresMejoras_USD?: string | number;
  TotalCobrado_USD?: string | number;
  TotalPendiente_USD?: string | number;
  TotalVencidoMora_USD?: string | number;
  CasosPagados?: string | number;
  CasosPendientes?: string | number;
}

export interface LegacyTopConsumerSqlResult {
  LecturaId: string | number;
  Sector: string | number;
  Cuenta: string | number;
  ClaveCatastral: string;
  NumeroDeMedidor: string | null;
  Direccion: string | null;
  Cliente: string;
  LecturaAnterior: string | number;
  LecturaActual: string | number;
  M3_Consumidos: string | number;
  ValorAgua_USD: string | number;
  ValorAlcantarillado_USD: string | number;
  ValorTitulo_USD?: string | number;
  TasaBasura_USD?: string | number;
  ValorTerceros_USD?: string | number;
  Interes_USD?: string | number;
  Recargo_USD?: string | number;
  FacturacionTotalEpaa_USD?: string | number;
  TotalFacturado_USD: string | number;
  Novedad: string | null;
  FechaCaptura: string | Date | null;
  Latitud?: string | number | null;
  Longitud?: string | number | null;
  FechaPago?: string | Date | null;
  FechaVencimiento?: string | Date | null;
  EstadoPago?: string;
  InteresMejoras_USD?: string | number;
  ValorTotalPagado_USD?: string | number;
  ValorTotalPendiente_USD?: string | number;
}

export interface LegacyInterannualComparisonSqlResult {
  Sector: string | number;
  Acometidas_Homologas: string | number;
  Lecturas_2025: string | number;
  Lecturas_2026: string | number;
  Delta_Lecturas: string | number;
  M3_2025: string | number;
  M3_2026: string | number;
  Delta_M3: string | number;
  Pct_Var_M3: string | number;
  Facturado_2025_USD: string | number;
  Facturado_2026_USD: string | number;
  Titulo_2025_USD?: string | number;
  Titulo_2026_USD?: string | number;
  Interes_2025_USD?: string | number;
  Interes_2026_USD?: string | number;
  Recargo_2025_USD?: string | number;
  Recargo_2026_USD?: string | number;
  Delta_USD: string | number;
  Pct_Var_USD: string | number;
  Diagnostico_Gestion: string;
  Recaudado_2025_USD?: string | number;
  Recaudado_2026_USD?: string | number;
  Delta_Recaudado_USD?: string | number;
  Pendiente_2025_USD?: string | number;
  Pendiente_2026_USD?: string | number;
  Delta_Pendiente_USD?: string | number;
  VencidoMora_2025_USD?: string | number;
  VencidoMora_2026_USD?: string | number;
  InteresMejoras_2025_USD?: string | number;
  InteresMejoras_2026_USD?: string | number;
}

export interface LegacyMonthlyConnectionGrowthSqlResult {
  MesNumero: string | number;
  NombreMes: string;
  Acometidas_2025: string | number;
  Aumento_Mes_2025: string | number;
  Acometidas_2026: string | number;
  Aumento_Mes_2026: string | number;
  Dif_2026_vs_2025: string | number;
  Pct_Var_Interanual: string | number;
  Estado_2026: string;
}
