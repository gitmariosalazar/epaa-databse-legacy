import {
  GeneralYearlyGroupedReportResponse,
  GeneralMonthlyGroupedReportResponse,
  GeneralYearlyKPIResponse,
  GeneralMonthlyKPIResponse,
  GeneralCollectionResponse,
  GeneralDailyGroupedReportResponse,
  GeneralKPIResponse,
} from '../../../../domain/schemas/dto/response/general-collection.response';
import {
  GeneralCollectionSQLResult,
  GeneralDailyGroupedReportSQLResult,
  GeneralKPIResponseSQLResult,
} from '../../../interfaces/sql/general-collection.sql.response';

export class SQLServerGeneralCollectionAdapter {
  // Aquí puedes agregar métodos para transformar los resultados SQL a tus DTOs de respuesta
  public static toGeneralKPIResponse(sqlResult: any): GeneralKPIResponse {
    return {
      uniqueCadastralKeys: sqlResult.unique_cadastral_keys,
      totalBillsIssued: sqlResult.total_bills_issued,
      averagePaidBill: sqlResult.average_paid_bill,
      countNotes: sqlResult.count_notes,
      totalNotesAmount: sqlResult.total_notes_amount,
      sections: [
        {
          typeKPI: 'EPAA',
          countTotal: sqlResult.total_bills_issued,
          countPending: sqlResult.pending_bills,
          countCollected: sqlResult.paid_bills,
          countZero: sqlResult.total_epaa_zero,
          countNull: sqlResult.total_epaa_null,
          countGreaterThanZero: sqlResult.total_epaa_greater_than_zero,
          countLessThanZero: sqlResult.total_epaa_less_than_zero,
          amountTotal: sqlResult.total_epaa,
          amountPending: sqlResult.total_epaa_pendings,
          amountCollected: sqlResult.total_epaa_collected,
          amountDiscounts: 0,
        },
        {
          typeKPI: 'SURCHARGE',
          countTotal: sqlResult.total_bills_issued,
          countPending: sqlResult.pending_bills,
          countCollected: sqlResult.paid_bills,
          countZero: sqlResult.total_surcharges_zero,
          countNull: sqlResult.total_surcharges_null,
          countGreaterThanZero: sqlResult.total_surcharges_greater_than_zero,
          countLessThanZero: sqlResult.total_surcharges_less_than_zero,
          amountTotal: sqlResult.total_surcharges,
          amountPending: sqlResult.total_surcharges_pending,
          amountCollected: sqlResult.total_surcharges_collected,
          amountDiscounts: 0,
        },
        {
          typeKPI: 'THIRD PARTIES',
          countTotal: sqlResult.total_bills_issued,
          countPending: sqlResult.pending_bills,
          countCollected: sqlResult.paid_bills,
          countZero: sqlResult.total_third_parties_zero,
          countNull: sqlResult.total_third_parties_null,
          countGreaterThanZero: sqlResult.total_third_parties_greater_than_zero,
          countLessThanZero: sqlResult.total_third_parties_less_than_zero,
          amountTotal: sqlResult.total_third_parties,
          amountPending: sqlResult.total_third_parties_pending,
          amountCollected: sqlResult.total_third_parties_collected,
          amountDiscounts: 0,
        },
        {
          typeKPI: 'IMPROVEMENTS',
          countTotal: sqlResult.total_bills_issued,
          countPending: sqlResult.pending_bills,
          countCollected: sqlResult.paid_bills,
          countZero: sqlResult.total_improvements_zero,
          countNull: sqlResult.total_improvements_null,
          countGreaterThanZero: sqlResult.total_improvements_greater_than_zero,
          countLessThanZero: sqlResult.total_improvements_less_than_zero,
          amountTotal: sqlResult.total_improvements,
          amountPending: sqlResult.total_improvements_pending,
          amountCollected: sqlResult.total_improvements_collected,
          amountDiscounts: 0,
        },
        {
          typeKPI: 'COLLECTION TRASH RATE',
          countTotal: sqlResult.count_bills_with_trash_rate,
          countPending: sqlResult.count_bills_with_trash_rate_pending,
          countCollected: sqlResult.count_bills_with_trash_rate_collected,
          countZero: sqlResult.total_trash_rate_zero,
          countNull: sqlResult.total_trash_rate_null,
          countGreaterThanZero: sqlResult.total_trash_rate_greater_than_zero,
          countLessThanZero: sqlResult.total_trash_rate_less_than_zero,
          amountTotal: sqlResult.total_trash_rate,
          amountPending: sqlResult.total_trash_rate_pending,
          amountCollected: sqlResult.total_trash_rate_collected,
          amountDiscounts: sqlResult.total_trash_rate_discounts,
        },
      ],
      codeTitle: sqlResult.code_title,
    };
  }

  static toGeneralCollectionResponse(
    sqlResult: GeneralCollectionSQLResult,
  ): GeneralCollectionResponse {
    return {
      incomeCode: sqlResult.income_code,
      cardId: sqlResult.card_id,
      name: sqlResult.name,
      incomeDate: sqlResult.income_date,
      paymentDate: sqlResult.payment_date,
      incomeStatus: sqlResult.income_status,
      titleCode: sqlResult.title_code,
      dueDate: sqlResult.due_date,
      titleValue: sqlResult.title_value,
      thirdPartyValue: sqlResult.third_party_value,
      surcharge: sqlResult.surcharge,
      trashRate: sqlResult.trash_rate,
      cadastralKey: sqlResult.cadastral_key,
      total: sqlResult.total,
      paymentUser: sqlResult.payment_user,
      paymentMethod: sqlResult.payment_method,
      comment: sqlResult.comment,
    };
  }

  static toGeneralCollectionDailyGroupedReportResponse(
    sqlResult: GeneralDailyGroupedReportSQLResult,
  ): GeneralDailyGroupedReportResponse {
    return {
      day: sqlResult.day,
      date: sqlResult.date,
      collector: sqlResult.collector,
      titleCode: sqlResult.title_code,
      paymentMethod: sqlResult.payment_method,
      status: sqlResult.status,
      titleValue: sqlResult.title_value,
      thirdPartyValue: sqlResult.third_party_value,
      surchargeValue: sqlResult.surcharge_value,
      trashRateValue: sqlResult.trash_rate_value,
      discountTrashRateValue: sqlResult.discount_trash_rate_value,
      totalValue: sqlResult.total_value,
      recordCount: sqlResult.record_count,
    };
  }

  static toGeneralYearlyGroupedReportResponse(
    sqlResult: any,
  ): GeneralYearlyGroupedReportResponse {
    return {
      year: sqlResult.year,
      collector: sqlResult.collector,
      titleCode: sqlResult.title_code,
      paymentMethod: sqlResult.payment_method,
      status: sqlResult.status,
      titleValue: sqlResult.title_value,
      thirdPartyValue: sqlResult.third_party_value,
      surchargeValue: sqlResult.surcharge_value,
      trashRateValue: sqlResult.trash_rate_value,
      discountTrashRateValue: sqlResult.discount_trash_rate_value,
      totalValue: sqlResult.total_value,
      recordCount: sqlResult.record_count,
    };
  }

  static toGeneralMonthlyGroupedReportResponse(
    sqlResult: any,
  ): GeneralMonthlyGroupedReportResponse {
    return {
      month: sqlResult.month,
      year: sqlResult.year,
      collector: sqlResult.collector,
      titleCode: sqlResult.title_code,
      paymentMethod: sqlResult.payment_method,
      status: sqlResult.status,
      titleValue: sqlResult.title_value,
      thirdPartyValue: sqlResult.third_party_value,
      surchargeValue: sqlResult.surcharge_value,
      trashRateValue: sqlResult.trash_rate_value,
      discountTrashRateValue: sqlResult.discount_trash_rate_value,
      totalValue: sqlResult.total_value,
      recordCount: sqlResult.record_count,
    };
  }

  static toGeneralYearlyKPIResponse(sqlResult: any): GeneralYearlyKPIResponse {
    const kpi = this.toGeneralKPIResponse(sqlResult);
    return {
      ...kpi,
      year: sqlResult.year,
    };
  }

  static toGeneralMonthlyKPIResponse(
    sqlResult: any,
  ): GeneralMonthlyKPIResponse {
    const kpi = this.toGeneralKPIResponse(sqlResult);
    return {
      ...kpi,
      year: sqlResult.year,
      month: sqlResult.month,
    };
  }
}
