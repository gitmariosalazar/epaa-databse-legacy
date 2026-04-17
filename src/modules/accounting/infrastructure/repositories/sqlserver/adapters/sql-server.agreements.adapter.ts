import { AgreementKPIsSqlResult } from '../../../interfaces/sql/agreements.sql.response';
import { AgreementKPIsResponse } from '../../../../domain/schemas/dto/response/agreements.response';

export class SqlServerAgreementsAdapter {
  // Aquí puedes agregar métodos para adaptar los datos de SQL Server a tu formato deseado
  // Por ejemplo, si necesitas transformar los resultados de la consulta a un formato específico
  adaptAgreementsKpiData(
    rawData: AgreementKPIsSqlResult[],
  ): AgreementKPIsResponse[] {
    return rawData.map((item: AgreementKPIsSqlResult) =>
      SqlServerAgreementsAdapter.fromSqlResult(item),
    );
  }

  static fromSqlResult(rawData: AgreementKPIsSqlResult): AgreementKPIsResponse {
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
}
