export interface TrashRateAuditRowResponse {
  incomeCode: number;
  cadastralKey: string;
  cardId: string;
  customerName: string;
  issueDate: string;
  paymentDate: string | null;
  paymentStatusCode: string | null;
  paymentStatus: string;
  rateInIncome: number;
  rateInValorTable: number | null;
  difference: number;
  diagnostic: string;
}

export interface MonthlySummaryRowResponse {
  paymentStatusCode: string | null;
  valorOrder: number | null;
  billCount: number;
  totalRateIncome: number;
  totalRateValorTable: number;
  totalDiscounts: number;
  totalTrashNet: number;
  missingValorRecords: number;
}

export interface MissingValorRowResponse {
  incomeCode: number;
  cadastralKey: string;
  cardId: string;
  customerName: string;
  issueDate: string;
  paymentDate: string | null;
  trashRate: number;
  paymentStatusCode: string | null;
  paymentStatus: string;
  diagnostic: string;
  valorOrder: number | null;
  rateInIncome: number;
  rateInValorTable: null;
}

export interface CreditNoteRowResponse {
  cadastralKey: string;
  cardId: string;
  customerName: string;
  totalTrashRateHistory: number;
  lastBillIssued: string | null;
  lastPaymentDate: string | null;
  totalBalanceInFavor: number;
  creditNoteCount: number;
  observation: string | null;
  creditCoverage: string;
  pendingTrashDebt: number;
  remainingDebtAfterNc: number;
}

export interface ClientTrashDetailRowResponse {
  incomeCode: number;
  cadastralKey: string;
  cardId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  paymentDate: string | null;
  paymentStatusCode: string | null;
  rateInIncome: number;
  rateInValorTable: number | null;
  officialRate: number;
  discountApplied: number;
  netRateToPay: number;
  creditNoteBalance: number | null;
  creditNoteObservation: string | null;
  effectiveTrashToPay: number;
  creditNoteLeftover: number;
  diagnostic: string;
}

export interface TopDebtorRowResponse {
  cadastralKey: string;
  cardId: string;
  customerName: string;
  unpaidMonths: number;
  totalTrashDebt: number;
  oldestDebtDate: string;
  latestPendingBill: string;
}

export interface TrashDashboardKpiResponse {
  totalBillsIssued: number;
  totalToCollect: number;
  totalCollected: number;
  totalPending: number;
  compliancePct: number;
  uniqueCadastralKeys: number;
  paidBills: number;
  pendingBills: number;
  missingValorRecords: number;
}
