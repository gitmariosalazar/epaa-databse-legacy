import {
  DailyCollectorSummary,
  DailyGroupedReport,
  DailyPaymentMethodReport,
  FullBreakdownReport,
} from '../../../../domain/schemas/dto/response/entry-data.response';
import {
  DailyCollectorSummarySQLResult,
  DailyGroupedReportSQLResult,
  DailyPaymentMethodReportSQLResult,
  FullBreakdownReportSQLResult,
} from '../../../interfaces/entry-data.sql.response';

export class SQLServerEntryDataAdapter {
  static toDomainDailyGroupedReport(
    data: DailyGroupedReportSQLResult,
  ): DailyGroupedReport {
    return {
      day: data.day,
      date: data.date,
      collector: data.collector,
      titleCode: data.title_code,
      paymentMethod: data.payment_method,
      status: data.status,
      titleValue: data.title_value,
      thirdPartyValue: data.third_party_value,
      surchargeValue: data.surcharge_value,
      trashRateValue: data.trash_rate_value,
      totalValue: data.total_value,
      recordCount: data.record_count,
      detailValue: data.detail_value,
      validate: data.validate,
      difference: data.difference,
    };
  }

  static toDomainDailyCollectorSummary(
    data: DailyCollectorSummarySQLResult,
  ): DailyCollectorSummary {
    return {
      date: data.date,
      collector: data.collector,
      totalCollected: data.total_collected,
      paymentCount: data.payment_count,
      titleValue: data.title_value,
      thirdPartyValue: data.third_party_value,
      surchargeValue: data.surcharge_value,
      trashRateValue: data.trash_rate_value,
      detailValue: data.detail_value,
      validate: data.validate,
      difference: data.difference,
    };
  }

  static toDomainDailyPaymentMethodReport(
    data: DailyPaymentMethodReportSQLResult,
  ): DailyPaymentMethodReport {
    return {
      date: data.date,
      paymentMethod: data.payment_method,
      status: data.status,
      total: data.total,
      recordCount: data.record_count,
      titleValue: data.title_value,
      thirdPartyValue: data.third_party_value,
      surchargeValue: data.surcharge_value,
      trashRateValue: data.trash_rate_value,
      detailValue: data.detail_value,
      validate: data.validate,
      difference: data.difference,
    };
  }

  static toDomainFullBreakdownReport(
    data: FullBreakdownReportSQLResult,
  ): FullBreakdownReport {
    return {
      date: data.date,
      collector: data.collector,
      titleCode: data.title_code,
      paymentMethod: data.payment_method,
      status: data.status,
      titleValue: data.title_value,
      thirdPartyValue: data.third_party_value,
      surchargeValue: data.surcharge_value,
      trashRateValue: data.trash_rate_value,
      grandTotal: data.grand_total,
      incomeCount: data.income_count,
      detailValue: data.detail_value,
      validate: data.validate,
      difference: data.difference,
    };
  }
}
