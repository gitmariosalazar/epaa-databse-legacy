import {
  ClientTrashDetailRowModel,
  CreditNoteRowModel,
  MissingValorRowModel,
  MonthlySummaryRowModel,
  TopDebtorRowModel,
  TrashDashboardKpiModel,
  TrashRateAuditRowModel,
} from '../../domain/models/trash-rate-report.model';
import {
  ClientTrashDetailRowResponse,
  CreditNoteRowResponse,
  MissingValorRowResponse,
  MonthlySummaryRowResponse,
  TopDebtorRowResponse,
  TrashDashboardKpiResponse,
  TrashRateAuditRowResponse,
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
      diagnostic: model.diagnostic,
      valorOrder: model.valorOrder,
      rateInIncome: model.rateInIncome,
      rateInValorTable: model.rateInValorTable,
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
    };
  }
}
