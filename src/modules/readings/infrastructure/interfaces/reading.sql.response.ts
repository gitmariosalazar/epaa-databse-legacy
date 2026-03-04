export interface ReadingSQLResult {
  sector: number;
  account: number;
  year: number;
  month: string;
  previousReading: number;
  currentReading: number;
  rentalIncomeCode: number | null;
  novelty: string | null;
  readingValue: number | null;
  sewerRate: number | null;
  reconnection: number | null;
  incomeCode: number | null;
  readingDate: Date;
  readingTime: string | null;
  cadastralKey: string;
}

export interface ReadingSQL2000Result {
  sector: number;
  account: number;
  year: number;
  month: string;
  previousReading: number;
  currentReading: number;
  rentalIncomeCode: number | null;
  novelty: string | null;
  readingValue: number | null;
  sewerRate: number | null;
  reconnection: number | null;
  incomeCode: number | null;
  readingDate: Date;
  readingTime: string | null;
  cadastralKey: string;
}

export interface TarifaSQLResult {
  Tarifa: string;
}

export interface RangoTarifaSQLResult {
  Minimo: number;
  Maximo: number;
  Base: number;
  Adicional: number;
}

export interface PendingReadingSQLResult {
  // ── Identificación del Cliente y Suministro ────────────────────────────────
  income_code: string;
  card_id: string;
  name: string;
  last_name: string;
  cadastral_key: string;
  address: string;
  rate: string;

  // ── Período de Facturación e Ingresos ──────────────────────────────────────
  month: string;
  year: number;
  month_due: string;
  year_due: number;
  due_date: Date | null;
  payment_date: Date | null;
  income_status: string;
  income_date: Date | null;

  // ── Lectura del Medidor ────────────────────────────────────────────────────
  current_reading: number;
  previous_reading: number;
  consumption: number;
  reading_status: string;
  reading_value: number;

  // ── Valores de Agua (Servicios Base) ───────────────────────────────────────
  epaa_value: number; // Valor Titulo
  third_party_value: number; // Valor Terceros
  surcharge: number; // Recargo
  total_epaa_value: number; // Agua + Terceros + Recargo

  // ── Tasa de Basura y Notas de Crédito ──────────────────────────────────────
  trash_rate_official: number; // Tarifa de basura OFICIAL (la que vale el mes actual)
  trash_rate: number; // Lo que EFECTIVAMENTE paga (0 si el saldo cubre todo)
  trash_rate_previous: number; // Crédito del pasado (AP_NotasCredito.Valor)
  balance_in_favor_next_month: number; // Saldo sobrante para el próx mes (Verde)
  balance_against_next_month: number; // Saldo en contra (Rojo)
  discount_trash_rate: number; // Descuento aplicado (0 en lecturas pendientes)
  total_trash_rate: number; // Total neto basura (coincidirá con trash_rate)

  // ── Totales de la Planilla ─────────────────────────────────────────────────
  total: number; // Sumatoria base de todo (sin deducciones de nota de crédito)
  adjusted_total: number; // Sumatoria final totalizada real a cobrar al cliente
}

export interface PaymentReadingSqlResponse {
  income_code: string;
  card_id: string;
  name: string;
  last_name: string;
  cadastral_key: string;
  address: string;
  rate: number;
  month: string;
  year: number;
  current_reading: number;
  previous_reading: number;
  reading_value: number;
  payment_user: string;
  title_code: string;
  consumption: number;
  reading_status: string;
  payment_date: string;
  trash_rate: number;
  epaa_value: number;
  third_party_value: number;
  surcharge: number;
  total: number;
  due_date: string;
  income_status: string;
  income_date: string;
  value: number;
  order_value: number;
  payment_method: string;
  comment: string;
}

export interface PaymentSqlResponse {
  income_code: string;
  card_id: string;
  name: string;
  income_date: string;
  payment_date: string;
  income_status: string;
  title_code: string;
  due_date: string;
  title_value: number;
  third_party_value: number;
  surcharge: number;
  trash_rate: number;
  cadastral_key: string;
  total: number;
  payment_user: string;
  value?: number;
  order_value?: number;
  payment_method: string;
  comment: string;
}
