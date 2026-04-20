import {
  AgreementInstallmentSqlResult,
  AgreementKPIsCustomerSqlResult,
  AgreementKPIsSqlResult,
} from '../../../interfaces/sql/agreements.sql.response';
import {
  AgreementInstallmentResponse,
  AgreementKPIsCustomerResponse,
  AgreementKPIsResponse,
  CitizenSummary,
  CollectorPerformance,
  Debtor,
  MonthlyCollectionSummary,
  PaymentMethodSummary,
} from '../../../../domain/schemas/dto/response/agreements.response';

export class SqlServerAgreementsAdapter {
  // Aquí puedes agregar métodos para adaptar los datos de SQL Server a tu formato deseado
  // Por ejemplo, si necesitas transformar los resultados de la consulta a un formato específico
  adaptAgreementsKpiData(
    rawData: AgreementKPIsSqlResult[],
  ): AgreementKPIsResponse[] {
    return rawData.map((item: AgreementKPIsSqlResult) =>
      SqlServerAgreementsAdapter.fromAgreementKpiSqlResultToAgreementKpiResponse(
        item,
      ),
    );
  }

  adaptAgreementKpiDataCustomer(
    rawData: AgreementKPIsCustomerSqlResult,
  ): AgreementKPIsCustomerResponse {
    return SqlServerAgreementsAdapter.fromAgreementCustomerKpiSqlResultToAgreementKpiCustomerResponse(
      rawData,
    );
  }

  adaptAgreementInstallmentData(
    rawData: AgreementInstallmentSqlResult,
  ): AgreementInstallmentResponse {
    return SqlServerAgreementsAdapter.fromAgreementInstallmentSqlResultToAgreementInstallmentResponse(
      rawData,
    );
  }

  static fromAgreementKpiSqlResultToAgreementKpiResponse(
    rawData: AgreementKPIsSqlResult,
  ): AgreementKPIsResponse {
    return {
      year: rawData.year,
      month: rawData.month,
      day: rawData.day,
      totalEmitted: rawData.total_emitted,
      totalCollected: rawData.total_collected,
      totalPending: rawData.total_pending,
      totalPrincipal: rawData.total_principal,
      totalInterest: rawData.total_interest,
      totalSurcharge: rawData.total_surcharge,
      principalCollected: rawData.principal_collected,
      principalRecoveryPct: rawData.principal_recovery_pct,
      collectionEfficiencyPct: rawData.collection_efficiency_pct,
      collectionAmountPct: rawData.collection_amount_pct,
      totalCitizensWithAgreements: rawData.total_citizens_with_agreements,
      totalInstallmentsCount: rawData.total_installments_count,
      totalInstallmentsPendings: rawData.total_installments_pendings,
      totalInstallmentsPaid: rawData.total_installments_paid,
      overdueInstallmentsCount: rawData.overdue_installments_count,
      overdueAmount: rawData.overdue_amount,
      avgOverdueDays: rawData.avg_overdue_days,
      maxOverdueDays: rawData.max_overdue_days,
      overdue1_30Days: rawData.overdue_1_30_days,
      overdue31_60Days: rawData.overdue_31_60_days,
      overdue61_90Days: rawData.overdue_61_90_days,
      overdueMore90Days: rawData.overdue_more_90_days,
      criticalOverdueCount: rawData.critical_overdue_count,
      capitalBalancePending: rawData.capital_balance_pending,
      avgInstallmentValue: rawData.avg_installment_value,
      avgDaysToPay: rawData.avg_days_to_pay,
    };
  }

  static fromAgreementCustomerKpiSqlResultToAgreementKpiCustomerResponse(
    rawData: AgreementKPIsCustomerSqlResult,
  ): AgreementKPIsCustomerResponse {
    return {
      year: rawData.year,
      month: rawData.month,
      day: rawData.day,
      totalEmitted: rawData.total_emitted,
      totalCollected: rawData.total_collected,
      totalPending: rawData.total_pending,
      totalPrincipal: rawData.total_principal,
      totalInterest: rawData.total_interest,
      totalSurcharge: rawData.total_surcharge,
      principalCollected: rawData.principal_collected,
      principalRecoveryPct: rawData.principal_recovery_pct,
      collectionEfficiencyPct: rawData.collection_efficiency_pct,
      collectionAmountPct: rawData.collection_amount_pct,
      totalCitizensWithAgreements: rawData.total_citizens_with_agreements,
      totalInstallmentsCount: rawData.total_installments_count,
      totalInstallmentsPendings: rawData.total_installments_pendings,
      totalInstallmentsPaid: rawData.total_installments_paid,
      overdueInstallmentsCount: rawData.overdue_installments_count,
      overdueAmount: rawData.overdue_amount,
      avgOverdueDays: rawData.avg_overdue_days,
      maxOverdueDays: rawData.max_overdue_days,
      overdue1_30Days: rawData.overdue_1_30_days,
      overdue31_60Days: rawData.overdue_31_60_days,
      overdue61_90Days: rawData.overdue_61_90_days,
      overdueMore90Days: rawData.overdue_more_90_days,
      criticalOverdueCount: rawData.critical_overdue_count,
      capitalBalancePending: rawData.capital_balance_pending,
      avgInstallmentValue: rawData.avg_installment_value,
      avgDaysToPay: rawData.avg_days_to_pay,
      firstInstallmentDate: rawData.first_installment_date,
      lastInstallmentDate: rawData.last_installment_date,
      oldestDueDate: rawData.oldest_due_date,
      totalAgreements: rawData.total_agreements,
      pendingNotOverdue: rawData.pending_not_overdue,
    };
  }

  adaptMonthlyCollectionSummary(rawData: any[]): MonthlyCollectionSummary[] {
    return rawData.map((item) => ({
      monthKey: item.month_key,
      amountEmitted: item.amount_emitted,
      amountCollected: item.amount_collected,
      amountPending: item.amount_pending,
      collectionEfficiencyPct: item.collection_efficiency_pct,
      collectionAmountPct: item.collection_amount_pct,
      principalEmitted: item.principal_emitted,
      interestEmitted: item.interest_emitted,
      surchargeEmitted: item.surcharge_emitted,
      totalInstallments: item.total_installments,
      paidInstallments: item.paid_installments,
      pendingInstallments: item.pending_installments,
    }));
  }

  adaptDebtors(rawData: any[]): Debtor[] {
    return rawData.map((item) => ({
      cardId: item.card_id,
      fullName: item.full_name,
      cadastralKey: item.cadastral_key,
      overdueInstallments: item.overdue_installments,
      totalDebt: item.total_debt,
      pendingPrincipal: item.pending_principal,
      lastDueDate: item.last_due_date,
      oldestDueDate: item.oldest_due_date,
      avgOverdueDays: item.avg_overdue_days,
      riskLevel: item.risk_level,
    }));
  }

  adaptCollectorPerformance(rawData: any[]): CollectorPerformance[] {
    return rawData.map((item) => ({
      collector: item.collector,
      totalPayments: item.total_payments,
      totalCollected: item.total_collected,
      avgPaymentAmount: item.avg_payment_amount,
      performancePct: item.performance_pct,
    }));
  }

  adaptPaymentMethodSummary(rawData: any[]): PaymentMethodSummary[] {
    return rawData.map((item) => ({
      paymentMethod: item.payment_method,
      methodTotal: item.method_total,
      transactionCount: item.transaction_count,
      avgAmountPerTransaction: item.avg_amount_per_transaction,
      contributionPct: item.contribution_pct,
    }));
  }

  adaptCitizenSummary(rawData: any[]): CitizenSummary[] {
    return rawData.map((item) => ({
      cadastralKey: item.cadastral_key,
      cardId: item.card_id,
      firstName: item.first_name,
      lastName: item.last_name,
      totalInstallments: item.total_installments,
      paidInstallments: item.paid_installments,
      pendingInstallments: item.pending_installments,
      totalAmountValue: item.total_amount_value,
      collectedAmount: item.collected_amount,
      pendingAmount: item.pending_amount,
      collectionEfficiencyPct: item.collection_efficiency_pct,
      transbanpiCount: item.transbanpi_count,
      cardCount: item.card_count,
      transferCount: item.transfer_count,
      checkCount: item.check_count,
      cashCount: item.cash_count,
      creditNoteCount: item.credit_note_count,
    }));
  }

  static fromAgreementInstallmentSqlResultToAgreementInstallmentResponse(
    rawData: AgreementInstallmentSqlResult, // Aquí deberías definir el tipo específico de tu resultado SQL para los detalles de los acuerdos
  ): AgreementInstallmentResponse {
    // Implementa la lógica de adaptación para los detalles de los acuerdos si es necesario
    return {
      citizenId: rawData.citizen_id,
      firstName: rawData.first_name,
      lastName: rawData.last_name,
      email: rawData.email,
      phone: rawData.phone,
      agreementId: rawData.agreement_id,
      issueDate: rawData.issue_date,
      dueDate: rawData.due_date,
      paymentDate: rawData.payment_date,
      principalAmount: rawData.principal_amount,
      interestAmount: rawData.interest_amount,
      surchargeAmount: rawData.surcharge_amount,
      totalInstallmentAmount: rawData.total_installment_amount,
      installmentStatus: rawData.installment_status,
      paymentStatus: rawData.payment_status,
      daysOverdue: rawData.days_overdue,
      overdueCategory: rawData.overdue_category,
      riskLevel: rawData.risk_level,
      pendingPrincipal: rawData.pending_principal,
      daysSinceIssue: rawData.days_since_issue,
      daysToPayment: rawData.days_to_payment,
    };
  }
}
