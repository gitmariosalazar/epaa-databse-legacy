import {
  ClientTrashDetailRowModel,
  CollectorPerformanceKPIModel,
  CreditNoteRowModel,
  DailyCollectorDetailModel,
  MissingValorRowModel,
  MonthlySummaryRowModel,
  TopDebtorRowModel,
  TrashDashboardKpiModel,
  TrashRateAuditRowModel,
  TrashRateKPIModel,
} from '../../domain/models/trash-rate-report.model';
import {
  ClientTrashDetailRowResponse,
  CollectorPerformanceKPIResponse,
  CreditNoteRowResponse,
  DailyCollectorDetailResponse,
  MissingValorRowResponse,
  MonthlySummaryRowResponse,
  TopDebtorRowResponse,
  TrashDashboardKpiResponse,
  TrashRateAuditRowResponse,
  TrashRateKPIResponse,
} from '../dtos/response/trash-rate-report.response';

export class TrashRateReportMapper {
  static fromTrashRateAuditRowModelToResponse(
    model: TrashRateAuditRowModel,
  ): TrashRateAuditRowResponse {
    return {
      incomeCode: model.incomeCode,
      cadastralKey: model.cadastralKey,
      cardId: model.cardId,
      customerName: model.customerName,
      issueDate: model.issueDate,
      paymentDate: model.paymentDate,
      paymentStatusCode: model.paymentStatusCode,
      paymentStatus: model.paymentStatus,
      rateInIncome: model.rateInIncome,
      rateInValorTable: model.rateInValorTable,
      difference: model.difference,
      diagnostic: model.diagnostic,
      discountApplied: model.discountApplied,
      creditNoteBalance: model.creditNoteBalance,
    };
  }

  static fromMonthlySummaryRowModelToResponse(
    model: MonthlySummaryRowModel,
  ): MonthlySummaryRowResponse {
    return {
      paymentStatusCode: model.paymentStatusCode,
      valorOrder: model.valorOrder,
      billCount: model.billCount,
      totalRateIncome: model.totalRateIncome,
      totalRateValorTable: model.totalRateValorTable,
      totalDiscounts: model.totalDiscounts,
      totalTrashNet: model.totalTrashNet,
      missingValorRecords: model.missingValorRecords,
    };
  }

  static fromMissingValorRowModelToResponse(
    model: MissingValorRowModel,
  ): MissingValorRowResponse {
    return {
      incomeCode: model.incomeCode,
      cadastralKey: model.cadastralKey,
      cardId: model.cardId,
      customerName: model.customerName,
      issueDate: model.issueDate,
      paymentDate: model.paymentDate,
      trashRate: model.trashRate,
      paymentStatusCode: model.paymentStatusCode,
      paymentStatus: model.paymentStatus,
      valorOrder: model.valorOrder,
      rateInIncome: model.rateInIncome,
      rateInValorTable: model.rateInValorTable,
      integrityGapIndivual: model.integrityGapIndivual,
      finalDiagnosis: model.finalDiagnosis,
    };
  }

  static fromCreditNoteRowModelToResponse(
    model: CreditNoteRowModel,
  ): CreditNoteRowResponse {
    return {
      cadastralKey: model.cadastralKey,
      cardId: model.cardId,
      customerName: model.customerName,
      totalTrashRateHistory: model.totalTrashRateHistory,
      lastBillIssued: model.lastBillIssued,
      lastPaymentDate: model.lastPaymentDate,
      totalBalanceInFavor: model.totalBalanceInFavor,
      creditNoteCount: model.creditNoteCount,
      observation: model.observation,
      creditCoverage: model.creditCoverage,
      pendingTrashDebt: model.pendingTrashDebt,
      remainingDebtAfterNc: model.remainingDebtAfterNc,
    };
  }

  static fromClientTrashDetailRowModelToResponse(
    model: ClientTrashDetailRowModel,
  ): ClientTrashDetailRowResponse {
    return {
      incomeCode: model.incomeCode,
      cadastralKey: model.cadastralKey,
      cardId: model.cardId,
      customerName: model.customerName,
      issueDate: model.issueDate,
      dueDate: model.dueDate,
      paymentDate: model.paymentDate,
      paymentStatusCode: model.paymentStatusCode,
      rateInIncome: model.rateInIncome,
      rateInValorTable: model.rateInValorTable,
      officialRate: model.officialRate,
      discountApplied: model.discountApplied,
      netRateToPay: model.netRateToPay,
      creditNoteBalance: model.creditNoteBalance,
      creditNoteObservation: model.creditNoteObservation,
      effectiveTrashToPay: model.effectiveTrashToPay,
      creditNoteLeftover: model.creditNoteLeftover,
      diagnostic: model.diagnostic,
    };
  }

  static fromTopDebtorRowModelToResponse(
    model: TopDebtorRowModel,
  ): TopDebtorRowResponse {
    return {
      cadastralKey: model.cadastralKey,
      cardId: model.cardId,
      customerName: model.customerName,
      unpaidMonths: model.unpaidMonths,
      totalTrashDebt: model.totalTrashDebt,
      oldestDebtDate: model.oldestDebtDate,
      latestPendingBill: model.latestPendingBill,
    };
  }

  static fromTrashDashboardKpiModelToResponse(
    model: TrashDashboardKpiModel,
  ): TrashDashboardKpiResponse {
    return {
      totalBillsIssued: model.totalBillsIssued,
      totalToCollect: model.totalToCollect,
      totalCollected: model.totalCollected,
      totalPending: model.totalPending,
      compliancePct: model.compliancePct,
      uniqueCadastralKeys: model.uniqueCadastralKeys,
      paidBills: model.paidBills,
      pendingBills: model.pendingBills,
      missingValorRecords: model.missingValorRecords,
      countNotes: model.countNotes,
      totalNotesAmount: model.totalNotesAmount,
      totalDiscounts: model.totalDiscounts,
    };
  }

  static fromTrashRateKPIModelToResponse(
    model: TrashRateKPIModel,
  ): TrashRateKPIResponse {
    return {
      category: model.category,
      totalBills: model.totalBills,
      uniqueCadastralKeys: model.uniqueCadastralKeys,
      sourceAmount: model.sourceAmount,
      valorAmount: model.valorAmount,
      integrityGap: model.integrityGap,
      grossAmount: model.grossAmount,
      netAmount: model.netAmount,
      discounts: model.discounts,
      paidBills: model.paidBills,
      pendingBills: model.pendingBills,
      collectionRate: model.collectionRate,
      creditNotesVolume: model.creditNotesVolume,
      creditNotesAmount: model.creditNotesAmount,
      revenueStatusJson: model.revenueStatusJson,
    };
  }

  static fromCollectorPerformanceKPIModelToResponse(
    model: CollectorPerformanceKPIModel,
  ): CollectorPerformanceKPIResponse {
    return {
      performanceRank: model.performanceRank,
      collectorId: model.collectorId,
      totalTransactions: model.totalTransactions,
      uniqueCustomersServed: model.uniqueCustomersServed,
      sourceTrashRateTotal: model.sourceTrashRateTotal,
      valorTableTotal: model.valorTableTotal,
      integrityGapAmount: model.integrityGapAmount,
      grossAmount: model.grossAmount,
      totalDiscountsApplied: model.totalDiscountsApplied,
      netCollectionTotal: model.netCollectionTotal,
      avgTicketSize: model.avgTicketSize,
      pctOfTotalRevenue: model.pctOfTotalRevenue,
      cancelledBillsCount: model.cancelledBillsCount,
      cancelledBillsValue: model.cancelledBillsValue,
    };
  }

  static fromDailyCollectorDetailModelToResponse(
    model: DailyCollectorDetailModel,
  ): DailyCollectorDetailResponse {
    return {
      collectorId: model.collectorId,
      paymentDate: model.paymentDate,
      incomeStatus: model.incomeStatus,
      transactionsCount: model.transactionsCount,
      sourceTrashRateDaily: model.sourceTrashRateDaily,
      valorTableDaily: model.valorTableDaily,
      integrityGapDaily: model.integrityGapDaily,
      grossDailyTotal: model.grossDailyTotal,
      discountsDailyTotal: model.discountsDailyTotal,
      netDailyCollection: model.netDailyCollection,
      avgTicketDaily: model.avgTicketDaily,
      cancelledCountDaily: model.cancelledCountDaily,
      cancelledValueDaily: model.cancelledValueDaily,
    };
  }
}
