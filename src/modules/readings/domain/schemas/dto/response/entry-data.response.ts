export class DateRangeParams {
  public startDate: string; // ISO string: '2026-02-01T00:00:00.000Z'
  public endDate: string; // ISO string: '2026-02-28T23:59:59.999Z'

  constructor(startDate: string, endDate: string) {
    this.startDate = startDate;
    this.endDate = endDate;
  }
}

export interface DailyGroupedReport {
  day: string; // YYYYMMDD  e.g. '20260201'
  date: string; // YYYY-MM-DD e.g. '2026-02-01'
  collector: string; // User_Cobro
  titleCode: string; // Cod_Titulo_Datos
  paymentMethod: string; // FormaDePago
  status: string; // Estado_Ingreso

  titleValue: number; // SUM(Valor_Titulo)
  thirdPartyValue: number; // SUM(ValorTerceros)
  surchargeValue: number; // SUM(Recargo)
  trashRateValue: number; // SUM(tasa_basura)
  discountTrashRateValue: number; // SUM(descuento) descuento de tasa de basura
  totalValue: number; // SUM of all four above
  recordCount: number; // COUNT(Cod_Ingreso)
  detailValue: number; // SUM(Valor) from Valor table
  validate: string; // 'OK' | 'DIFERENCIA'
  difference: number; // title_value - detail_value
}

export interface DailyCollectorSummary {
  date: string; // YYYY-MM-DD
  collector: string; // User_Cobro

  totalCollected: number; // Grand total (all value components)
  paymentCount: number; // COUNT(Cod_Ingreso)

  titleValue: number; // SUM(Valor_Titulo)
  thirdPartyValue: number; // SUM(ValorTerceros)
  surchargeValue: number; // SUM(Recargo)
  trashRateValue: number; // SUM(tasa_basura)
  discountTrashRateValue: number; // SUM(descuento) descuento de tasa de basura
  detailValue: number; // SUM(Valor) from Valor table
  validate: string; // 'OK' | 'DIFERENCIA'
  difference: number; // title_value - detail_value
}

export interface DailyPaymentMethodReport {
  date: string; // YYYY-MM-DD
  paymentMethod: string; // FormaDePago
  status: string; // Estado_Ingreso

  total: number; // Grand total (all value components)
  recordCount: number; // COUNT(Cod_Ingreso)

  titleValue: number; // SUM(Valor_Titulo)
  thirdPartyValue: number; // SUM(ValorTerceros)
  surchargeValue: number; // SUM(Recargo)
  trashRateValue: number; // SUM(tasa_basura)
  discountTrashRateValue: number; // SUM(descuento) descuento de tasa de basura
  detailValue: number; // SUM(Valor) from Valor table
  validate: string; // 'OK' | 'DIFERENCIA'
  difference: number; // title_value - detail_value
}

export interface FullBreakdownReport {
  date: string; // YYYY-MM-DD
  collector: string; // User_Cobro
  titleCode: string; // Cod_Titulo_Datos
  paymentMethod: string; // FormaDePago
  status: string; // Estado_Ingreso

  titleValue: number; // SUM(Valor_Titulo)
  thirdPartyValue: number; // SUM(ValorTerceros)
  surchargeValue: number; // SUM(Recargo)
  trashRateValue: number; // SUM(tasa_basura)
  discountTrashRateValue: number; // SUM(descuento) descuento de tasa de basura
  grandTotal: number; // SUM of all four main components
  incomeCount: number; // COUNT(DISTINCT Cod_Ingreso)
  detailValue: number; // SUM(Valor) from Valor table
  validate: string; // 'OK' | 'DIFERENCIA'
  difference: number; // title_value - detail_value
}

export type AnyIncomeReport =
  | DailyGroupedReport
  | DailyCollectorSummary
  | DailyPaymentMethodReport
  | FullBreakdownReport;
