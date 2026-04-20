export interface AgreementKPIsResponse {
  year: number;
  month: number | null;
  day: number | null;
  totalEmitted: number;
  totalCollected: number;
  totalPending: number;
  totalPrincipal: number;
  totalInterest: number;
  totalSurcharge: number;
  principalCollected: number;
  principalRecoveryPct: number;
  collectionEfficiencyPct: number;
  collectionAmountPct: number;
  totalCitizensWithAgreements: number;
  totalInstallmentsCount: number;
  totalInstallmentsPendings: number;
  totalInstallmentsPaid: number;
  overdueInstallmentsCount: number;
  overdueAmount: number;
  avgOverdueDays: number;
  maxOverdueDays: number;
  overdue1_30Days: number;
  overdue31_60Days: number;
  overdue61_90Days: number;
  overdueMore90Days: number;
  criticalOverdueCount: number;
  capitalBalancePending: number;
  avgInstallmentValue: number;
  avgDaysToPay: number;
}

export interface AgreementKPIsCustomerResponse extends AgreementKPIsResponse {
  firstInstallmentDate: Date | string | null;
  lastInstallmentDate: Date | string | null;
  oldestDueDate: Date | string | null;
  totalAgreements: number;
  pendingNotOverdue: number;
}

export interface CollectorPerformance {
  collector: string;
  totalPayments: number;
  totalCollected: number;
  avgPaymentAmount: number;
  performancePct: number;
}

export interface MonthlyCollectionSummary {
  monthKey: string; // YYYY-MM
  amountEmitted: number;
  amountCollected: number;
  amountPending: number;
  collectionEfficiencyPct: number;
  collectionAmountPct: number;
  principalEmitted: number;
  interestEmitted: number;
  surchargeEmitted: number;
  totalInstallments: number;
  paidInstallments: number;
  pendingInstallments: number;
}

export interface Debtor {
  cardId: string;
  fullName: string;
  cadastralKey: string;
  overdueInstallments: number;
  totalDebt: number;
  pendingPrincipal: number;
  lastDueDate: Date | string;
  oldestDueDate: Date | string | null;
  avgOverdueDays: number | null;
  riskLevel: 'CRÍTICO' | 'ALTO' | 'MEDIO' | 'BAJO';
}

export interface PaymentMethodSummary {
  paymentMethod: string;
  methodTotal: number;
  transactionCount: number;
  avgAmountPerTransaction: number;
  contributionPct: number;
}

export interface CitizenSummary {
  cadastralKey: string;
  cardId: string;
  firstName: string;
  lastName: string;
  totalInstallments: number;
  paidInstallments: number;
  pendingInstallments: number;
  totalAmountValue: number;
  collectedAmount: number;
  pendingAmount: number;
  collectionEfficiencyPct: number;
  // Formas de pago
  transbanpiCount: number;
  cardCount: number;
  transferCount: number;
  checkCount: number;
  cashCount: number;
  creditNoteCount: number;
}

export interface AgreementInstallmentResponse {
  /** ID del ciudadano */
  citizenId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  /** ID del convenio / acuerdo */
  agreementId: string;

  /** Fecha de emisión de la cuota */
  issueDate: Date | string;

  /** Fecha de vencimiento */
  dueDate: Date | string;

  /** Fecha en que se pagó (null si no está pagada) */
  paymentDate: Date | string | null;

  // ==================== VALORES FINANCIEROS ====================
  principalAmount: number;
  interestAmount: number;
  surchargeAmount: number;
  totalInstallmentAmount: number;

  // ==================== ESTADO ====================
  installmentStatus: 'PAID' | 'OVERDUE' | 'PENDING' | 'UNKNOWN';
  paymentStatus: 0 | 1; // 1 = Pagado, 0 = Pendiente

  // ==================== MORA ====================
  daysOverdue: number;

  overdueCategory:
    | 'PAID'
    | 'ON_TIME'
    | '1-30 DAYS'
    | '31-60 DAYS'
    | '61-90 DAYS'
    | 'MORE THAN 90 DAYS'
    | 'NO_ARREARS';

  riskLevel: 'CRITICAL' | 'NORMAL';

  // ==================== ADICIONALES ====================
  pendingPrincipal: number;
  daysSinceIssue: number;
  daysToPayment: number | null; // Solo tiene valor si ya está pagada
}
