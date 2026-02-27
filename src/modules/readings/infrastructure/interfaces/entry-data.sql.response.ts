export interface DailyGroupedReportSQLResult {
  day: string; // YYYYMMDD  e.g. '20260201'
  date: string; // YYYY-MM-DD e.g. '2026-02-01'
  collector: string; // User_Cobro
  title_code: string; // Cod_Titulo_Datos
  payment_method: string; // FormaDePago
  status: string; // Estado_Ingreso

  title_value: number; // SUM(Valor_Titulo)
  third_party_value: number; // SUM(ValorTerceros)
  surcharge_value: number; // SUM(Recargo)
  trash_rate_value: number; // SUM(tasa_basura)
  total_value: number; // SUM of all four above
  record_count: number; // COUNT(Cod_Ingreso)
  detail_value: number; // SUM(Valor) from Valor table
  validate: string; // 'OK' | 'DIFERENCIA'
  difference: number; // title_value - detail_value
}

export interface DailyCollectorSummarySQLResult {
  date: string; // YYYY-MM-DD
  collector: string; // User_Cobro

  total_collected: number; // Grand total (all value components)
  payment_count: number; // COUNT(Cod_Ingreso)

  title_value: number; // SUM(Valor_Titulo)
  third_party_value: number; // SUM(ValorTerceros)
  surcharge_value: number; // SUM(Recargo)
  trash_rate_value: number; // SUM(tasa_basura)
  detail_value: number; // SUM(Valor) from Valor table
  validate: string; // 'OK' | 'DIFERENCIA'
  difference: number; // title_value - detail_value
}

export interface DailyPaymentMethodReportSQLResult {
  date: string; // YYYY-MM-DD
  payment_method: string; // FormaDePago
  status: string; // Estado_Ingreso

  total: number; // Grand total (all value components)
  record_count: number; // COUNT(Cod_Ingreso)

  title_value: number; // SUM(Valor_Titulo)
  third_party_value: number; // SUM(ValorTerceros)
  surcharge_value: number; // SUM(Recargo)
  trash_rate_value: number; // SUM(tasa_basura)
  detail_value: number; // SUM(Valor) from Valor table
  validate: string; // 'OK' | 'DIFERENCIA'
  difference: number; // title_value - detail_value
}

export interface FullBreakdownReportSQLResult {
  date: string; // YYYY-MM-DD
  collector: string; // User_Cobro
  title_code: string; // Cod_Titulo_Datos
  payment_method: string; // FormaDePago
  status: string; // Estado_Ingreso

  title_value: number; // SUM(Valor_Titulo)
  third_party_value: number; // SUM(ValorTerceros)
  surcharge_value: number; // SUM(Recargo)
  trash_rate_value: number; // SUM(tasa_basura)
  grand_total: number; // SUM of all four main components
  income_count: number; // COUNT(DISTINCT Cod_Ingreso)
  detail_value: number; // SUM(Valor) from Valor table
  validate: string; // 'OK' | 'DIFERENCIA'
  difference: number; // title_value - detail_value
}
