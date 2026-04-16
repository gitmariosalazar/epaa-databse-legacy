import {
  TrashRateAuditRowSqlResult,
  MonthlySummaryRowSqlResult,
  MissingValorRowSqlResult,
  CreditNoteRowSqlResult,
  ClientTrashDetailRowSqlResult,
  TopDebtorRowSqlResult,
  TrashDashboardKpiSqlResult,
  TrashRateKPISqlResult,
  CollectorPerformanceKPISqlResult,
  DailyCollectorDetailSqlResult,
} from '../../interfaces/sql/trash-rate-report.sql-result';
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
} from '../../../domain/models/trash-rate-report.model';
import { TrashRateKPIResponse } from '../../../application/dtos/response/trash-rate-report.response';

export class TrashRateReportAdapter {
  static fromTrashRateAuditRowResponseToTrashRateAuditRowModel(
    response: TrashRateAuditRowSqlResult,
  ): TrashRateAuditRowModel {
    return {
      incomeCode: response.income_code,
      cadastralKey: response.cadastral_key,
      cardId: response.card_id,
      customerName: response.customer_name,
      issueDate: response.issue_date,
      paymentDate: response.payment_date,
      paymentStatusCode: response.payment_status_code,
      paymentStatus: response.payment_status,
      rateInIncome: response.rate_in_income,
      rateInValorTable: response.rate_in_valor_table,
      difference: response.difference,
      diagnostic: response.diagnostic,
      discountApplied: response.discount_applied,
      creditNoteBalance: response.credit_note_balance,
    };
  }

  static fromMonthlySummaryRowResponseToMonthlySummaryRowModel(
    response: MonthlySummaryRowSqlResult,
  ): MonthlySummaryRowModel {
    return {
      paymentStatusCode: response.payment_status_code,
      valorOrder: response.valor_order,
      billCount: response.bill_count,
      totalRateIncome: response.total_rate_income,
      totalRateValorTable: response.total_rate_valor_table,
      totalDiscounts: response.total_discounts,
      totalTrashNet: response.total_trash_net,
      missingValorRecords: response.missing_valor_records,
    };
  }

  static fromMissingValorRowResponseToMissingValorRowModel(
    response: MissingValorRowSqlResult,
  ): MissingValorRowModel {
    return {
      incomeCode: response.income_code,
      cadastralKey: response.cadastral_key,
      cardId: response.card_id,
      dataTitleCode: response.data_title_code,
      customerName: response.customer_name,
      issueDate: response.issue_date,
      paymentDate: response.payment_date,
      trashRate: response.trash_rate,
      paymentStatusCode: response.payment_status_code,
      paymentStatus: response.payment_status,
      valorOrder: response.valor_order,
      rateInIncome: response.rate_in_income,
      rateInValorTable: response.rate_in_valor_table,
      integrityGapIndivual: response.integrity_gap_indivual,
      finalDiagnosis: response.final_diagnosis,
    };
  }

  static fromCreditNoteRowResponseToCreditNoteRowModel(
    response: CreditNoteRowSqlResult,
  ): CreditNoteRowModel {
    return {
      cadastralKey: response.cadastral_key,
      cardId: response.card_id,
      customerName: response.customer_name,
      totalTrashRateHistory: response.total_trash_rate_history,
      lastBillIssued: response.last_bill_issued,
      lastPaymentDate: response.last_payment_date,
      totalBalanceInFavor: response.total_balance_in_favor,
      creditNoteCount: response.credit_note_count,
      observation: response.observation,
      creditCoverage: response.credit_coverage,
      pendingTrashDebt: response.pending_trash_debt,
      remainingDebtAfterNc: response.remaining_debt_after_nc,
    };
  }

  static fromClientTrashDetailRowResponseToClientTrashDetailRowModel(
    response: ClientTrashDetailRowSqlResult,
  ): ClientTrashDetailRowModel {
    return {
      incomeCode: response.income_code,
      cadastralKey: response.cadastral_key,
      cardId: response.card_id,
      customerName: response.customer_name,
      issueDate: response.issue_date,
      dueDate: response.due_date,
      paymentDate: response.payment_date,
      paymentStatusCode: response.payment_status_code,
      rateInIncome: response.rate_in_income,
      rateInValorTable: response.rate_in_valor_table,
      officialRate: response.official_rate,
      discountApplied: response.discount_applied,
      netRateToPay: response.net_rate_to_pay,
      creditNoteBalance: response.credit_note_balance,
      creditNoteObservation: response.credit_note_observation,
      effectiveTrashToPay: response.effective_trash_to_pay,
      creditNoteLeftover: response.credit_note_leftover,
      diagnostic: response.diagnostic,
    };
  }

  static fromTopDebtorRowResponseToTopDebtorRowModel(
    response: TopDebtorRowSqlResult,
  ): TopDebtorRowModel {
    return {
      cadastralKey: response.cadastral_key,
      cardId: response.card_id,
      customerName: response.customer_name,
      unpaidMonths: response.unpaid_months,
      totalTrashDebt: response.total_trash_debt,
      oldestDebtDate: response.oldest_debt_date,
      latestPendingBill: response.latest_pending_bill,
    };
  }

  static fromTrashDashboardKpiResponseToTrashDashboardKpiModel(
    response: TrashDashboardKpiSqlResult,
  ): TrashDashboardKpiModel {
    return {
      totalBillsIssued: response.total_bills_issued,
      totalToCollect: response.total_to_collect,
      totalCollected: response.total_collected,
      totalPending: response.total_pending,
      compliancePct: response.compliance_pct,
      uniqueCadastralKeys: response.unique_cadastral_keys,
      paidBills: response.paid_bills,
      pendingBills: response.pending_bills,
      missingValorRecords: response.missing_valor_records,
      countNotes: response.count_notes,
      totalNotesAmount: response.total_notes_amount,
      totalDiscounts: response.total_discounts,
    };
  }

  static fromTrashRateKPISqlResultToTrashRateKPIModel(
    response: TrashRateKPISqlResult,
  ): TrashRateKPIModel {
    return new TrashRateKPIModel(
      response.category_name,
      response.total_bills,
      response.unique_cadastral_keys,
      response.source_trash_rate,
      response.valor_table_amount,
      response.integrity_gap,
      response.gross_amount,
      response.net_amount,
      response.discounts,
      response.paid_bills,
      response.pending_bills,
      response.collection_rate,
      response.credit_notes_volume,
      response.credit_notes_amount,
      response.revenue_status_json,
    );
  }

  static fromCollectorPerformanceKPISqlResultToCollectorPerformanceKPIModel(
    response: CollectorPerformanceKPISqlResult,
  ): CollectorPerformanceKPIModel {
    return {
      performanceRank: response.performance_rank,
      collectorId: response.collector_id,
      totalTransactions: response.total_transactions,
      uniqueCustomersServed: response.unique_customers_served,
      sourceTrashRateTotal: response.source_trash_rate_total,
      valorTableTotal: response.valor_table_total,
      integrityGapAmount: response.integrity_gap_amount,
      grossAmount: response.gross_amount,
      totalDiscountsApplied: response.total_discounts_applied,
      netCollectionTotal: response.net_collection_total,
      avgTicketSize: response.avg_ticket_size,
      pctOfTotalRevenue: response.pct_of_total_revenue,
      cancelledBillsCount: response.cancelled_bills_count,
      cancelledBillsValue: response.cancelled_bills_value,
    };
  }

  static fromDailyCollectorDetailSqlResultToDailyCollectorDetailModel(
    response: DailyCollectorDetailSqlResult,
  ): DailyCollectorDetailModel {
    return {
      collectorId: response.collector_id,
      paymentDate: response.payment_date,
      incomeStatus: response.income_status,
      transactionsCount: response.transactions_count,
      sourceTrashRateDaily: response.source_trash_rate_daily,
      valorTableDaily: response.valor_table_daily,
      integrityGapDaily: response.integrity_gap_daily,
      grossDailyTotal: response.gross_daily_total,
      discountsDailyTotal: response.discounts_daily_total,
      netDailyCollection: response.net_daily_collection,
      avgTicketDaily: response.avg_ticket_daily,
      cancelledCountDaily: response.cancelled_count_daily,
      cancelledValueDaily: response.cancelled_value_daily,
    };
  }
}
