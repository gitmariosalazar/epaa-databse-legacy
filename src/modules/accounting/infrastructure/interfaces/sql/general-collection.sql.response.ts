export type typeKPI =
  | 'EPAA'
  | 'SURCHARGE'
  | 'COLLECTION TRASH RATE'
  | 'THIRD PARTIES'
  | 'IMPROVEMENTS';

export interface KPISectionSQLResult {
  typeKPI: typeKPI;
  // Conteos (Bills)
  count_total: number;
  count_pending: number;
  count_collected: number;
  count_zero: number;
  count_null: number;
  count_greater_than_zero: number;
  count_less_than_zero: number;

  // Valores Monetarios (Importante para tus SUM de SQL)
  amount_total: number;
  amount_pending: number;
  amount_collected: number;
  amount_discounts?: number; // Solo aplica a trash_rate según tu SQL
}

export interface GeneralKPIResponseSQLResult {
  unique_cadastral_keys: number;
  total_bills_issued: number; // El COUNT(di.Cod_Ingreso) general
  average_paid_bill: number;
  count_notes: number;
  total_notes_amount: number;
  sections: KPISectionSQLResult[]; // El array con el desglose de cada tipo
  code_title: string;
}

export interface GeneralCollectionSQLResult {
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
  payment_method: string;
  comment: string;
}

export interface GeneralDailyGroupedReportSQLResult {
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
  discount_trash_rate_value: number; // SUM(descuento) descuento de tasa de basura
  total_value: number; // SUM of all four above
  record_count: number; // COUNT(Cod_Ingreso)
}
