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

export interface OverduePaymentSqlResponse {
  cadastral_key: string;
  client_id: string;
  name: string;
  total_trash_rate: number;
  total_epaa_value: number;
  total_old_improvements_interest: number;
  total_surcharge: number;
  total_old_surcharge: number;
  months_past_due: number;
  total_interest_calculated: number;
  total_debt_amount: number;
  emision_date_more_old: string;
  emision_date_more_recent: string;
  due_date_more_old: string;
  due_date_more_recent: string;
  days_since_due: number;
  days_since_emission: number;
}

export interface OverdueSummarySqlResult {
  total_clients_with_debt: number;
  total_unique_cadastral_keys: number;
  total_months_past_due: number;
  total_debt_amount: number;
  total_epaa_value: number;
  total_trash_rate: number;
  total_surcharge: number;
  total_old_surcharge: number;
  total_improvements_interest: number;
  total_interest_calculated: number;
  avg_months_past_due: number;
  max_months_in_debt: number;
  min_months_in_debt: number;
  clients_over_6_months: number;
  clients_over_1_year: number;
  max_days_in_debt: number;
  avg_debt_per_client: number;
}

export interface YearlyOverdueSummarySqlResult {
  year: number;
  total_unique_clients: number;
  total_unique_cadastral_keys: number;
  clients_with_debt: number;
  total_unique_cadastral_keys_by_year: number;
  total_months_past_due: number;
  total_debt_amount: number;
  total_epaa_value: number;
  total_trash_rate: number;
  total_surcharge: number;
  total_old_surcharge: number;
  total_improvements_interest: number;
  total_interest_calculated: number;
  avg_months_past_due: number;
  max_months_in_debt: number;
  min_months_in_debt: number;
  clients_over_6_months: number;
  clients_over_1_year: number;
  max_days_in_debt: number;
  avg_debt_per_client: number;
}

export interface MonthlyDebtSummarySqlResult {
  year: number;
  month: number;
  month_name: string;

  total_unique_clients: number;
  total_unique_cadastral_keys: number;

  clients_with_debt_this_month: number;
  unique_cadastral_keys_this_month: number;

  total_months_past_due: number;
  total_debt_amount: number;

  total_epaa_value: number;
  total_trash_rate: number;
  total_surcharge: number;
  total_old_surcharge: number;
  total_improvements_interest: number;
  total_interest_calculated: number;

  avg_months_past_due: number | null;
  max_months_in_debt: number;
  min_months_in_debt: number;

  clients_over_6_months: number;
  clients_over_1_year: number;

  max_days_in_debt: number;
  avg_debt_per_client: number;
}

export interface PendingReadingSQLResult {
  income_code?: string;
  income_title_code?: string;
  reading_capture_date?: string;
  card_id: string;
  name: string;
  last_name: string;
  cadastral_key: string;
  address: string;
  rate: string;
  interest_value: number;
  month: string;
  year: number;
  current_reading: number;
  previous_reading: number;
  reading_value: number;
  consumption: number;
  month_due: string;
  year_due: number;
  reading_status: string;
  payment_date: string;
  trash_rate_official: number;
  trash_rate: number;
  trash_rate_previous: number;
  balance_in_favor_current_month: number;
  balance_in_favor_next_month: number;
  balance_against_next_month: number;
  discount_trash_rate: number;
  total_trash_rate: number;
  epaa_value: number;
  third_party_value: number;
  surcharge: number;
  total_epaa_value: number;
  total: number;
  due_date: string;
  income_status: string;
  income_date: string;
  adjusted_total: number;
  due_date_status: string;
}
