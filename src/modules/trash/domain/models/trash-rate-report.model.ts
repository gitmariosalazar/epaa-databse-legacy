export class TrashRateAuditRowModel {
  constructor(
    public readonly incomeCode: number,
    public readonly cadastralKey: string,
    public readonly cardId: string,
    public readonly customerName: string,
    public readonly issueDate: string,
    public readonly paymentDate: string | null,
    public readonly paymentStatusCode: string | null,
    public readonly paymentStatus: string,
    public readonly rateInIncome: number,
    public readonly rateInValorTable: number | null,
    public readonly difference: number,
    public readonly diagnostic: string,
    public readonly discountApplied: number,
    public readonly creditNoteBalance: number | null,
    public readonly paymentMethod: string | null,
    public readonly collector: string | null,
  ) {}
}

export class MonthlySummaryRowModel {
  constructor(
    public readonly paymentStatusCode: string | null,
    public readonly valorOrder: number | null,
    public readonly billCount: number,
    public readonly totalRateIncome: number,
    public readonly totalRateValorTable: number,
    public readonly totalDiscounts: number,
    public readonly totalTrashNet: number,
    public readonly missingValorRecords: number,
  ) {}
}

export class MissingValorRowModel {
  constructor(
    public readonly incomeCode: number,
    public readonly cadastralKey: string,
    public readonly cardId: string,
    public readonly dataTitleCode: string,
    public readonly customerName: string,
    public readonly issueDate: string,
    public readonly paymentDate: string | null,
    public readonly trashRate: number,
    public readonly paymentStatusCode: string | null,
    public readonly paymentStatus: string,
    public readonly valorOrder: number | null,
    public readonly rateInIncome: number | null,
    public readonly rateInValorTable: number | null,
    public readonly integrityGapIndivual: number,
    public readonly finalDiagnosis: string,
  ) {}
}

export class CreditNoteRowModel {
  constructor(
    public readonly cadastralKey: string,
    public readonly cardId: string,
    public readonly customerName: string,
    public readonly totalTrashRateHistory: number,
    public readonly lastBillIssued: string | null,
    public readonly lastPaymentDate: string | null,
    public readonly totalBalanceInFavor: number,
    public readonly creditNoteCount: number,
    public readonly observation: string | null,
    public readonly creditCoverage: string,
    public readonly pendingTrashDebt: number,
    public readonly remainingDebtAfterNc: number,
  ) {}
}

export class ClientTrashDetailRowModel {
  constructor(
    public readonly incomeCode: number,
    public readonly cadastralKey: string,
    public readonly cardId: string,
    public readonly customerName: string,
    public readonly issueDate: string,
    public readonly dueDate: string,
    public readonly paymentDate: string | null,
    public readonly paymentStatusCode: string | null,
    public readonly rateInIncome: number,
    public readonly rateInValorTable: number | null,
    public readonly officialRate: number,
    public readonly discountApplied: number,
    public readonly netRateToPay: number,
    public readonly creditNoteBalance: number | null,
    public readonly creditNoteObservation: string | null,
    public readonly effectiveTrashToPay: number,
    public readonly creditNoteLeftover: number,
    public readonly diagnostic: string,
  ) {}
}

export class TopDebtorRowModel {
  constructor(
    public readonly cadastralKey: string,
    public readonly cardId: string,
    public readonly customerName: string,
    public readonly unpaidMonths: number,
    public readonly totalTrashDebt: number,
    public readonly oldestDebtDate: string,
    public readonly latestPendingBill: string,
  ) {}
}

export class TrashDashboardKpiModel {
  constructor(
    public readonly totalBillsIssued: number,
    public readonly totalToCollect: number,
    public readonly totalCollected: number,
    public readonly totalPending: number,
    public readonly compliancePct: number,
    public readonly uniqueCadastralKeys: number,
    public readonly paidBills: number,
    public readonly pendingBills: number,
    public readonly missingValorRecords: number,
    public readonly countNotes: number,
    public readonly totalNotesAmount: number,
    public readonly totalDiscounts: number,
  ) {}
}

export class TrashRateKPIModel {
  constructor(
    public readonly category: string,
    public readonly totalBills: number,
    public readonly uniqueCadastralKeys: number,
    public readonly sourceAmount: number,
    public readonly valorAmount: number,
    public readonly integrityGap: number,
    public readonly grossAmount: number,
    public readonly netAmount: number,
    public readonly discounts: number,
    public readonly paidBills: number,
    public readonly pendingBills: number,
    public readonly collectionRate: number,
    public readonly creditNotesVolume: number,
    public readonly creditNotesAmount: number,
    public readonly revenueStatusJson?: string,
  ) {}
}

export class CollectorPerformanceKPIModel {
  constructor(
    public readonly performanceRank: number,
    public readonly collectorId: string,
    public readonly totalTransactions: number,
    public readonly uniqueCustomersServed: number,
    public readonly sourceTrashRateTotal: number,
    public readonly valorTableTotal: number,
    public readonly integrityGapAmount: number,
    public readonly grossAmount: number,
    public readonly totalDiscountsApplied: number,
    public readonly netCollectionTotal: number,
    public readonly avgTicketSize: number,
    public readonly pctOfTotalRevenue: number,
    public readonly cancelledBillsCount: number,
    public readonly cancelledBillsValue: number,
  ) {}
}

export class DailyCollectorDetailModel {
  constructor(
    public readonly collectorId: string,
    public readonly paymentDate: string,
    public readonly incomeStatus: string,
    public readonly transactionsCount: number,
    public readonly sourceTrashRateDaily: number,
    public readonly valorTableDaily: number,
    public readonly integrityGapDaily: number,
    public readonly grossDailyTotal: number,
    public readonly discountsDailyTotal: number,
    public readonly netDailyCollection: number,
    public readonly avgTicketDaily: number,
    public readonly cancelledCountDaily: number,
    public readonly cancelledValueDaily: number,
  ) {}
}
