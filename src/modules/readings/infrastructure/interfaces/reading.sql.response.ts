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
  // Cliente (solo en la primera fila):
  card_id: string;
  name: string;
  last_name: string;
  // Por cada suministro/planilla:
  cadastral_key: string;
  address: string;
  rate: string;
  month: string;
  year: number;
  current_reading: number;
  previous_reading: number;
  reading_value: number;
  consumption: number;
  month_due: string;
  year_due: number;
  reading_status: string;
  payment_date: Date | null;

  // ▼ Campos Modificados de Basura ▼
  trash_rate_official: number; // Tarifa de basura OFICIAL (la que vale el mes actual)
  trash_rate_for_payment: number; // Lo que EFECTIVAMENTE paga (0 si el saldo cubre todo)
  trash_rate_previous: number; // Crédito del pasado
  balance_in_favor_next_month: number; // Saldo sobrante para el próx mes (Verde)
  balance_against_next_month: number; // Saldo en contra (Rojo)
  discount_trash_rate: number; // Descuento aplicado (siempre 0 en deudas)
  total_trash_rate: number; // Total neto basura (tasa actual + ajuste, coincidirá con for_payment)

  epaa_value: number; // Valor Titulo
  third_party_value: number; // Valor Terceros
  surcharge: number; // Recargo
  total_epaa_value: number; // Agua + Terceros + Recargo
  total: number; // Sumatoria base de todo (sin ajustes)
  adjusted_total: number; // Sumatoria final totalizada del cliente

  due_date: Date | null;
  income_status: string;
  income_date: Date | null;
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
