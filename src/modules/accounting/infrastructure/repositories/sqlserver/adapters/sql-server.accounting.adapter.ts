import {
  MonthlyDebtSummaryResponse,
  OverduePaymentResponse,
  OverdueSummaryResponse,
  PaymentReadingResponse,
  PaymentResponse,
  PendingReadingResponse,
  YearlyOverdueSummaryResponse,
} from '../../../../domain/schemas/dto/response/accounting.response';
import {
  MonthlyDebtSummarySqlResult,
  OverduePaymentSqlResponse,
  OverdueSummarySqlResult,
  PaymentReadingSqlResponse,
  PaymentSqlResponse,
  PendingReadingSQLResult,
  YearlyOverdueSummarySqlResult,
} from '../../../interfaces/sql/accounting.sql.response';

export class SQLServerAccountingAdapter {
  static toDomainPending(
    data: PendingReadingSQLResult,
  ): PendingReadingResponse {
    return {
      // ── Identificación del Cliente y Suministro ────────────────────────────────
      incomeCode: data.income_code ? String(data.income_code).trim() : '',
      incomeTitleCode: data.income_title_code
        ? String(data.income_title_code).trim()
        : undefined,
      readingCaptureDate: data.reading_capture_date
        ? new Date(String(data.reading_capture_date).trim())
        : undefined,
      cardId: String(data.card_id).trim(),
      name: data.name ? String(data.name).trim() : '',
      lastName: data.last_name ? String(data.last_name).trim() : '',
      cadastralKey: String(data.cadastral_key).trim(),
      address: data.address ? String(data.address).trim() : '',
      rate: data.rate ? String(data.rate).trim() : '',
      interestValue: data.interest_value ? Number(data.interest_value) : 0,

      // ── Período de Facturación e Ingresos ──────────────────────────────────────
      month: data.month ? String(data.month).trim() : '',
      year: data.year ? Number(data.year) : 0,
      monthDue: data.month_due ? String(data.month_due).trim() : '',
      yearDue: data.year_due ? Number(data.year_due) : 0,
      dueDate: data.due_date ? new Date(String(data.due_date).trim()) : null,
      paymentDate: data.payment_date
        ? new Date(String(data.payment_date).trim())
        : null,
      incomeStatus: data.income_status ? String(data.income_status).trim() : '',
      incomeDate: data.income_date
        ? new Date(String(data.income_date).trim())
        : null,

      // ── Lectura del Medidor ────────────────────────────────────────────────────
      currentReading: data.current_reading ? Number(data.current_reading) : 0,
      previousReading: data.previous_reading
        ? Number(data.previous_reading)
        : 0,
      consumption: data.consumption ? Number(data.consumption) : 0,
      readingStatus: data.reading_status
        ? String(data.reading_status).trim()
        : '',
      readingValue: data.reading_value ? Number(data.reading_value) : 0,

      // ── Valores de Agua (Servicios Base) ───────────────────────────────────────
      epaaValue: data.epaa_value ? Number(data.epaa_value) : 0,
      thirdPartyValue: data.third_party_value
        ? Number(data.third_party_value)
        : 0,
      surcharge: data.surcharge ? Number(data.surcharge) : 0,
      totalEpaaValue: data.total_epaa_value ? Number(data.total_epaa_value) : 0,

      // ── Tasa de Basura y Notas de Crédito ──────────────────────────────────────
      trashRateOfficial: data.trash_rate_official
        ? Number(data.trash_rate_official)
        : 0,
      trashRate: data.trash_rate ? Number(data.trash_rate) : 0,
      trashRatePrevious: data.trash_rate_previous
        ? Number(data.trash_rate_previous)
        : 0,
      balanceInFavorCurrentMonth: data.balance_in_favor_current_month
        ? Number(data.balance_in_favor_current_month)
        : 0,
      balanceInFavorNextMonth: data.balance_in_favor_next_month
        ? Number(data.balance_in_favor_next_month)
        : 0,
      balanceAgainstNextMonth: data.balance_against_next_month
        ? Number(data.balance_against_next_month)
        : 0,
      discountTrashRate: data.discount_trash_rate
        ? Number(data.discount_trash_rate)
        : 0,
      totalTrashRate: data.total_trash_rate ? Number(data.total_trash_rate) : 0,

      // ── Totales de la Planilla ─────────────────────────────────────────────────
      total: data.total ? Number(data.total) : 0,
      adjustedTotal: data.adjusted_total ? Number(data.adjusted_total) : 0,
      dueDateStatus: data.due_date_status ? data.due_date_status : '',
    };
  }

  static fromPaymentReadingSqlResponseToPaymentReadingResponse(
    data: PaymentReadingSqlResponse,
  ): PaymentReadingResponse {
    return {
      incomeCode: data.income_code ? String(data.income_code).trim() : '',
      cardId: String(data.card_id).trim(),
      name: data.name ? String(data.name).trim() : '',
      lastName: data.last_name ? String(data.last_name).trim() : '',
      cadastralKey: String(data.cadastral_key).trim(),
      address: data.address ? String(data.address).trim() : '',
      rate: data.rate ? Number(data.rate) : 0,
      month: data.month ? String(data.month).trim() : '',
      year: data.year ? Number(data.year) : 0,
      currentReading: data.current_reading ? Number(data.current_reading) : 0,
      previousReading: data.previous_reading
        ? Number(data.previous_reading)
        : 0,
      readingValue: data.reading_value ? Number(data.reading_value) : 0,
      paymentUser: data.payment_user ? String(data.payment_user).trim() : '',
      titleCode: data.title_code ? String(data.title_code).trim() : '',
      consumption: data.consumption ? Number(data.consumption) : 0,
      readingStatus: data.reading_status
        ? String(data.reading_status).trim()
        : '',
      paymentDate: data.payment_date ? String(data.payment_date).trim() : '',
      trashRate: data.trash_rate ? Number(data.trash_rate) : 0,
      epaaValue: data.epaa_value ? Number(data.epaa_value) : 0,
      thirdPartyValue: data.third_party_value
        ? Number(data.third_party_value)
        : 0,
      surcharge: data.surcharge ? Number(data.surcharge) : 0,
      total: data.total ? Number(data.total) : 0,
      dueDate: data.due_date ? String(data.due_date).trim() : '',
      incomeStatus: data.income_status ? String(data.income_status).trim() : '',
      incomeDate: data.income_date ? String(data.income_date).trim() : '',
      value: data.value ? Number(data.value) : 0,
      orderValue: data.order_value ? Number(data.order_value) : 0,
      paymentMethod: data.payment_method
        ? String(data.payment_method).trim()
        : '',
      comment: data.comment ? String(data.comment).trim() : '',
    };
  }

  static fromPaymentSqlResponseToPaymentResponse(
    data: PaymentSqlResponse,
  ): PaymentResponse {
    return {
      incomeCode: data.income_code ? String(data.income_code).trim() : '',
      cardId: String(data.card_id).trim(),
      name: data.name ? String(data.name).trim() : '',
      incomeDate: data.income_date ? String(data.income_date).trim() : '',
      paymentDate: data.payment_date ? String(data.payment_date).trim() : '',
      incomeStatus: data.income_status ? String(data.income_status).trim() : '',
      titleCode: data.title_code ? String(data.title_code).trim() : '',
      dueDate: data.due_date ? String(data.due_date).trim() : '',
      titleValue: data.title_value ? Number(data.title_value) : 0,
      thirdPartyValue: data.third_party_value
        ? Number(data.third_party_value)
        : 0,
      surcharge: data.surcharge ? Number(data.surcharge) : 0,
      trashRate: data.trash_rate ? Number(data.trash_rate) : 0,
      cadastralKey: String(data.cadastral_key).trim(),
      total: data.total ? Number(data.total) : 0,
      paymentUser: data.payment_user ? String(data.payment_user).trim() : '',
      value: data.value ? Number(data.value) : 0,
      orderValue: data.order_value ? Number(data.order_value) : 0,
      paymentMethod: data.payment_method
        ? String(data.payment_method).trim()
        : '',
      comment: data.comment ? String(data.comment).trim() : '',
    };
  }

  static fromOverduePaymentSqlResponseToOverduePaymentResponse(
    data: OverduePaymentSqlResponse,
  ): OverduePaymentResponse {
    return {
      cadastralKey: String(data.cadastral_key).trim(),
      clientId: String(data.client_id).trim(),
      name: data.name ? String(data.name).trim() : '',
      totalTrashRate: data.total_trash_rate ? Number(data.total_trash_rate) : 0,
      totalEpaaValue: data.total_epaa_value ? Number(data.total_epaa_value) : 0,
      totalOldImprovementsInterest: data.total_old_improvements_interest
        ? Number(data.total_old_improvements_interest)
        : 0,
      totalOldSurcharge: data.total_old_surcharge
        ? Number(data.total_old_surcharge)
        : 0,
      totalSurcharge: data.total_surcharge ? Number(data.total_surcharge) : 0,
      monthsPastDue: data.months_past_due ? Number(data.months_past_due) : 0,
      totalInterestCalculated: data.total_interest_calculated
        ? Number(data.total_interest_calculated)
        : 0,
      totalDebtAmount: data.total_debt_amount
        ? Number(data.total_debt_amount)
        : 0,
      emisionDateMoreOld: data.emision_date_more_old
        ? String(data.emision_date_more_old).trim()
        : '',
      emisionDateMoreRecent: data.emision_date_more_recent
        ? String(data.emision_date_more_recent).trim()
        : '',
      dueDateMoreOld: data.due_date_more_old
        ? String(data.due_date_more_old).trim()
        : '',
      dueDateMoreRecent: data.due_date_more_recent
        ? String(data.due_date_more_recent).trim()
        : '',
      daysSinceDue: data.days_since_due ? Number(data.days_since_due) : 0,
      daysSinceEmission: data.days_since_emission
        ? Number(data.days_since_emission)
        : 0,
    };
  }

  static fromOverdueSummarySqlResultToOverdueSummaryResponse(
    data: OverdueSummarySqlResult,
  ): OverdueSummaryResponse {
    return {
      totalClientsWithDebt:
        data.total_clients_with_debt != null
          ? Number(data.total_clients_with_debt)
          : 0,
      totalUniqueCadastralKeys:
        data.total_unique_cadastral_keys != null
          ? Number(data.total_unique_cadastral_keys)
          : 0,
      totalMonthsPastDue:
        data.total_months_past_due != null
          ? Number(data.total_months_past_due)
          : 0,
      totalDebtAmount:
        data.total_debt_amount != null ? Number(data.total_debt_amount) : 0,
      totalEpaaValue:
        data.total_epaa_value != null ? Number(data.total_epaa_value) : 0,
      totalTrashRate:
        data.total_trash_rate != null ? Number(data.total_trash_rate) : 0,
      totalSurcharge:
        data.total_surcharge != null ? Number(data.total_surcharge) : 0,
      totalOldSurcharge:
        data.total_old_surcharge != null ? Number(data.total_old_surcharge) : 0,
      totalImprovementsInterest:
        data.total_improvements_interest != null
          ? Number(data.total_improvements_interest)
          : 0,
      totalInterestCalculated:
        data.total_interest_calculated != null
          ? Number(data.total_interest_calculated)
          : 0,
      avgMonthsPastDue:
        data.avg_months_past_due != null ? Number(data.avg_months_past_due) : 0,
      maxMonthsInDebt:
        data.max_months_in_debt != null ? Number(data.max_months_in_debt) : 0,
      minMonthsInDebt:
        data.min_months_in_debt != null ? Number(data.min_months_in_debt) : 0,
      clientsOver6Months:
        data.clients_over_6_months != null
          ? Number(data.clients_over_6_months)
          : 0,
      clientsOver1Year:
        data.clients_over_1_year != null ? Number(data.clients_over_1_year) : 0,
      maxDaysInDebt:
        data.max_days_in_debt != null ? Number(data.max_days_in_debt) : 0,
      avgDebtPerClient:
        data.avg_debt_per_client != null ? Number(data.avg_debt_per_client) : 0,
    };
  }

  static fromYearlySummarySqlResultToYearlySummaryResponse(
    data: YearlyOverdueSummarySqlResult,
  ): YearlyOverdueSummaryResponse {
    return {
      year: data.year != null ? Number(data.year) : 0,
      totalUniqueClients:
        data.total_unique_clients != null
          ? Number(data.total_unique_clients)
          : 0,
      totalUniqueCadastralKeys:
        data.total_unique_cadastral_keys != null
          ? Number(data.total_unique_cadastral_keys)
          : 0,
      clientsWithDebt:
        data.clients_with_debt != null ? Number(data.clients_with_debt) : 0,
      totalUniqueCadastralKeysByYear:
        data.total_unique_cadastral_keys_by_year != null
          ? Number(data.total_unique_cadastral_keys_by_year)
          : 0,
      totalMonthsPastDue:
        data.total_months_past_due != null
          ? Number(data.total_months_past_due)
          : 0,
      totalDebtAmount:
        data.total_debt_amount != null ? Number(data.total_debt_amount) : 0,
      totalEpaaValue:
        data.total_epaa_value != null ? Number(data.total_epaa_value) : 0,
      totalTrashRate:
        data.total_trash_rate != null ? Number(data.total_trash_rate) : 0,
      totalSurcharge:
        data.total_surcharge != null ? Number(data.total_surcharge) : 0,
      totalOldSurcharge:
        data.total_old_surcharge != null ? Number(data.total_old_surcharge) : 0,
      totalImprovementsInterest:
        data.total_improvements_interest != null
          ? Number(data.total_improvements_interest)
          : 0,
      totalInterestCalculated:
        data.total_interest_calculated != null
          ? Number(data.total_interest_calculated)
          : 0,
      avgMonthsPastDue:
        data.avg_months_past_due != null ? Number(data.avg_months_past_due) : 0,
      maxMonthsInDebt:
        data.max_months_in_debt != null ? Number(data.max_months_in_debt) : 0,
      minMonthsInDebt:
        data.min_months_in_debt != null ? Number(data.min_months_in_debt) : 0,
      clientsOver6Months:
        data.clients_over_6_months != null
          ? Number(data.clients_over_6_months)
          : 0,
      clientsOver1Year:
        data.clients_over_1_year != null ? Number(data.clients_over_1_year) : 0,
      maxDaysInDebt:
        data.max_days_in_debt != null ? Number(data.max_days_in_debt) : 0,
      avgDebtPerClient:
        data.avg_debt_per_client != null ? Number(data.avg_debt_per_client) : 0,
    };
  }

  static fromMonthlySummarySqlResultToMonthlySummaryResponse(
    data: MonthlyDebtSummarySqlResult,
  ): MonthlyDebtSummaryResponse {
    return {
      year: data.year != null ? Number(data.year) : 0,
      month: data.month != null ? Number(data.month) : 0,
      monthName: data.month_name ? String(data.month_name).trim() : '',

      totalUniqueClients:
        data.total_unique_clients != null
          ? Number(data.total_unique_clients)
          : 0,
      totalUniqueCadastralKeys:
        data.total_unique_cadastral_keys != null
          ? Number(data.total_unique_cadastral_keys)
          : 0,

      clientsWithDebtThisMonth:
        data.clients_with_debt_this_month != null
          ? Number(data.clients_with_debt_this_month)
          : 0,
      uniqueCadastralKeysThisMonth:
        data.unique_cadastral_keys_this_month != null
          ? Number(data.unique_cadastral_keys_this_month)
          : 0,

      totalMonthsPastDue:
        data.total_months_past_due != null
          ? Number(data.total_months_past_due)
          : 0,
      totalDebtAmount:
        data.total_debt_amount != null ? Number(data.total_debt_amount) : 0,

      totalEpaaValue:
        data.total_epaa_value != null ? Number(data.total_epaa_value) : 0,
      totalTrashRate:
        data.total_trash_rate != null ? Number(data.total_trash_rate) : 0,
      totalSurcharge:
        data.total_surcharge != null ? Number(data.total_surcharge) : 0,
      totalOldSurcharge:
        data.total_old_surcharge != null ? Number(data.total_old_surcharge) : 0,
      totalImprovementsInterest:
        data.total_improvements_interest != null
          ? Number(data.total_improvements_interest)
          : 0,
      totalInterestCalculated:
        data.total_interest_calculated != null
          ? Number(data.total_interest_calculated)
          : 0,

      avgMonthsPastDue:
        data.avg_months_past_due != null ? Number(data.avg_months_past_due) : 0,
      maxMonthsInDebt:
        data.max_months_in_debt != null ? Number(data.max_months_in_debt) : 0,
      minMonthsInDebt:
        data.min_months_in_debt != null ? Number(data.min_months_in_debt) : 0,
      clientsOver6Months:
        data.clients_over_6_months != null
          ? Number(data.clients_over_6_months)
          : 0,
      clientsOver1Year:
        data.clients_over_1_year != null ? Number(data.clients_over_1_year) : 0,
      maxDaysInDebt:
        data.max_days_in_debt != null ? Number(data.max_days_in_debt) : 0,
      avgDebtPerClient:
        data.avg_debt_per_client != null ? Number(data.avg_debt_per_client) : 0,
    };
  }
}
