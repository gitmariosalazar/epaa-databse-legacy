export interface TrashRateAuditRowSqlResult {
  income_code: number;
  cadastral_key: string;
  card_id: string;
  customer_name: string;
  issue_date: string;
  payment_date: string | null;
  payment_status_code: string | null;
  payment_status: string;
  rate_in_income: number;
  rate_in_valor_table: number | null;
  difference: number;
  diagnostic: string;
  discount_applied: number;
  credit_note_balance: number | null;
}

export interface MonthlySummaryRowSqlResult {
  payment_status_code: string | null;
  valor_order: number | null;
  bill_count: number;
  total_rate_income: number;
  total_rate_valor_table: number;
  total_discounts: number;
  total_trash_net: number;
  missing_valor_records: number;
}

export interface MissingValorRowSqlResult {
  income_code: number;
  cadastral_key: string;
  card_id: string;
  customer_name: string;
  issue_date: string;
  payment_date: string | null;
  trash_rate: number;
  payment_status_code: string | null;
  payment_status: string;
  valor_order: number | null;
  rate_in_income: number | null;
  rate_in_valor_table: number | null;
  integrity_gap_indivual: number;
  final_diagnosis: string;
}

export interface CreditNoteRowSqlResult {
  cadastral_key: string;
  card_id: string;
  customer_name: string;
  total_trash_rate_history: number;
  last_bill_issued: string | null;
  last_payment_date: string | null;
  total_balance_in_favor: number;
  credit_note_count: number;
  observation: string | null;
  credit_coverage: string;
  pending_trash_debt: number;
  remaining_debt_after_nc: number;
}

export interface ClientTrashDetailRowSqlResult {
  income_code: number;
  cadastral_key: string;
  card_id: string;
  customer_name: string;
  issue_date: string;
  due_date: string;
  payment_date: string | null;
  payment_status_code: string | null;
  rate_in_income: number;
  rate_in_valor_table: number | null;
  official_rate: number;
  discount_applied: number;
  net_rate_to_pay: number;
  credit_note_balance: number | null;
  credit_note_observation: string | null;
  effective_trash_to_pay: number;
  credit_note_leftover: number;
  diagnostic: string;
}

export interface TopDebtorRowSqlResult {
  cadastral_key: string;
  card_id: string;
  customer_name: string;
  unpaid_months: number;
  total_trash_debt: number;
  oldest_debt_date: string;
  latest_pending_bill: string;
}

export interface TrashDashboardKpiSqlResult {
  total_bills_issued: number;
  total_to_collect: number;
  total_collected: number;
  total_pending: number;
  compliance_pct: number;
  unique_cadastral_keys: number;
  paid_bills: number;
  pending_bills: number;
  missing_valor_records: number;
  count_notes: number;
  total_notes_amount: number;
  total_discounts: number;
}

export interface TrashRateKPISqlResult {
  category_name: string;
  total_bills: number;
  unique_cadastral_keys: number;
  source_trash_rate: number;
  valor_table_amount: number;
  integrity_gap: number;
  gross_amount: number;
  net_amount: number;
  discounts: number;
  paid_bills: number;
  pending_bills: number;
  collection_rate: number;
  credit_notes_volume: number;
  credit_notes_amount: number;
  revenue_status_json?: string;
}

export interface CollectorPerformanceKPISqlResult {
  performance_rank: number;
  collector_id: string;
  total_transactions: number;
  unique_customers_served: number;
  source_trash_rate_total: number;
  valor_table_total: number;
  integrity_gap_amount: number;
  gross_amount: number;
  total_discounts_applied: number;
  net_collection_total: number;
  avg_ticket_size: number;
  pct_of_total_revenue: number;
  cancelled_bills_count: number;
  cancelled_bills_value: number;
}

export interface DailyCollectorDetailSqlResult {
  collector_id: string;
  payment_date: string;
  income_status: string;
  transactions_count: number;
  source_trash_rate_daily: number;
  valor_table_daily: number;
  integrity_gap_daily: number;
  gross_daily_total: number;
  discounts_daily_total: number;
  net_daily_collection: number;
  avg_ticket_daily: number;
  cancelled_count_daily: number;
  cancelled_value_daily: number;
}
