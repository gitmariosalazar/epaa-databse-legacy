export interface AgreementKPIsSqlResult {
  year: number;
  month: number | null;
  day: number | null;
  total_emitted: number;
  total_collected: number;
  total_pending: number;
  total_principal: number;
  total_interest: number;
  total_surcharge: number;
  principal_collected: number;
  principal_recovery_pct: number;
  collection_efficiency_pct: number;
  collection_amount_pct: number;
  total_citizens_with_agreements: number;
  total_installments_count: number;
  total_installments_pendings: number;
  total_installments_paid: number;
  overdue_installments_count: number;
  overdue_amount: number;
  avg_overdue_days: number;
  max_overdue_days: number;
  overdue_1_30_days: number;
  overdue_31_60_days: number;
  overdue_61_90_days: number;
  overdue_more_90_days: number;
  critical_overdue_count: number;
  capital_balance_pending: number;
  avg_installment_value: number;
  avg_days_to_pay: number;
}

export interface AgreementKPIsCustomerSqlResult {
  year: number;
  month: number | null;
  day: number | null;
  citizen_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  total_emitted: number;
  total_collected: number;
  total_pending: number;
  total_principal: number;
  total_interest: number;
  total_surcharge: number;
  principal_collected: number;
  principal_recovery_pct: number;
  collection_efficiency_pct: number;
  collection_amount_pct: number;
  total_citizens_with_agreements: number;
  total_installments_count: number;
  total_installments_pendings: number;
  total_installments_paid: number;
  overdue_installments_count: number;
  overdue_amount: number;
  avg_overdue_days: number;
  max_overdue_days: number;
  overdue_1_30_days: number;
  overdue_31_60_days: number;
  overdue_61_90_days: number;
  overdue_more_90_days: number;
  critical_overdue_count: number;
  capital_balance_pending: number;
  avg_installment_value: number;
  avg_days_to_pay: number;
  first_installment_date: string | null; // YYYY-MM-DD
  last_installment_date: string | null; // YYYY-MM-DD
  oldest_due_date: string | null; // YYYY-MM-DD
  total_agreements: number;
  pending_not_overdue: number;
}

export interface AgreementInstallmentSqlResult {
  /** ID del ciudadano */
  citizen_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;

  /** ID del convenio / acuerdo */
  agreement_id: string;

  /** Fecha de emisión de la cuota */
  issue_date: Date | string;

  /** Fecha de vencimiento */
  due_date: Date | string;

  /** Fecha en que se pagó (null si no está pagada) */
  payment_date: Date | string | null;

  // ==================== VALORES FINANCIEROS ====================
  principal_amount: number;
  interest_amount: number;
  surcharge_amount: number;
  total_installment_amount: number;

  // ==================== ESTADO ====================
  installment_status: 'PAID' | 'OVERDUE' | 'PENDING' | 'UNKNOWN';
  payment_status: 0 | 1; // 1 = Pagado, 0 = Pendiente

  // ==================== MORA ====================
  days_overdue: number;

  overdue_category:
    | 'PAID'
    | 'ON_TIME'
    | '1-30 DAYS'
    | '31-60 DAYS'
    | '61-90 DAYS'
    | 'MORE THAN 90 DAYS'
    | 'NO_ARREARS';

  risk_level: 'CRITICAL' | 'NORMAL';

  // ==================== ADICIONALES ====================
  pending_principal: number;
  days_since_issue: number;
  days_to_payment: number | null; // Solo tiene valor si ya está pagada
}
export interface CollectorPerformanceSqlResult {
  collector: string;
  total_payments: number;
  total_collected: number;
  avg_payment_amount: number;
  performance_pct: number;
}

export interface MonthlyCollectionSummarySqlResult {
  month_key: string;
  amount_emitted: number;
  amount_collected: number;
  amount_pending: number;
  collection_efficiency_pct: number;
  collection_amount_pct: number;
  principal_emitted: number;
  interest_emitted: number;
  surcharge_emitted: number;
  total_installments: number;
  paid_installments: number;
  pending_installments: number;
}

export interface DebtorSqlResult {
  card_id: string;
  full_name: string;
  cadastral_key: string;
  overdue_installments: number;
  total_debt: number;
  pending_principal: number;
  last_due_date: Date | string;
  oldest_due_date: Date | string | null;
  avg_overdue_days: number | null;
  risk_level: 'CRÍTICO' | 'ALTO' | 'MEDIO' | 'BAJO';
}

export interface PaymentMethodSummarySqlResult {
  payment_method: string;
  method_total: number;
  transaction_count: number;
  avg_amount_per_transaction: number;
  contribution_pct: number;
}

export interface CitizenSummarySqlResult {
  cadastral_key: string;
  card_id: string;
  first_name: string;
  last_name: string;
  total_installments: number;
  paid_installments: number;
  pending_installments: number;
  total_amount_value: number;
  collected_amount: number;
  pending_amount: number;
  collection_efficiency_pct: number;
  transbanpi_count: number;
  card_count: number;
  transfer_count: number;
  check_count: number;
  cash_count: number;
  credit_note_count: number;
}
