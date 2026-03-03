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
  trash_rate: number;
  trash_rate_previous: number;
  epaa_value: number;
  third_party_value: number;
  balance_in_favor: number;
  balance_against: number;
  discount_trash_rate: number;
  surcharge: number;
  adjusted_total: number;
  total: number;
  due_date: Date | null;
  income_status: string;
  income_date: Date | null;
  total_trash_rate: number; // tasa_basura + (tasa_basura - tasa_basura_anterior_oficial)
  total_epaa_value: number; // Valor_Titulo + ValorTerceros
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
