import {
  PaymentReadingResponse,
  PaymentResponse,
  PendingReadingResponse,
  ReadingResponse,
} from '../../../../domain/schemas/dto/response/readings.response';
import {
  PaymentReadingSqlResponse,
  PaymentSqlResponse,
  PendingReadingSQLResult,
  ReadingSQLResult,
} from '../../../interfaces/reading.sql.response';

export class SQLServerReadingAdapter {
  static toDomain(data: ReadingSQLResult): ReadingResponse {
    return {
      sector: data.sector,
      account: data.account,
      year: data.year,
      month: data.month,
      previousReading: data.previousReading,
      currentReading: data.currentReading,
      rentalIncomeCode: data.rentalIncomeCode,
      novelty: data.novelty,
      readingValue: data.readingValue,
      sewerRate: data.sewerRate,
      reconnection: data.reconnection,
      incomeCode: data.incomeCode,
      readingDate: data.readingDate,
      readingTime: data.readingTime,
      cadastralKey: data.cadastralKey,
    };
  }

  static toDomain2000(data: ReadingSQLResult): ReadingResponse {
    return {
      sector: Number(data.sector),
      account: Number(data.account),
      year: Number(data.year),
      month: String(data.month).trim(),
      previousReading:
        data.previousReading != null ? Number(data.previousReading) : 0,
      currentReading:
        data.currentReading != null ? Number(data.currentReading) : null,
      rentalIncomeCode:
        data.rentalIncomeCode != null ? Number(data.rentalIncomeCode) : null,
      novelty: data.novelty ? String(data.novelty).trim() : null,
      readingValue:
        data.readingValue != null ? Number(data.readingValue) : null,
      sewerRate: data.sewerRate != null ? Number(data.sewerRate) : null,
      reconnection:
        data.reconnection != null ? Number(data.reconnection) : null,
      incomeCode: Number(data.incomeCode),
      readingDate: data.readingDate || null,
      readingTime: data.readingTime ? String(data.readingTime).trim() : null,
      cadastralKey: data.cadastralKey ? String(data.cadastralKey).trim() : '',
    };
  }

  static toDomainPending(
    data: PendingReadingSQLResult,
  ): PendingReadingResponse {
    return {
      cardId: String(data.card_id).trim(),
      name: data.name ? String(data.name).trim() : '',
      lastName: data.last_name ? String(data.last_name).trim() : '',
      cadastralKey: String(data.cadastral_key).trim(),
      address: data.address ? String(data.address).trim() : '',
      rate: data.rate ? String(data.rate).trim() : '',
      month: data.month ? String(data.month).trim() : '',
      year: data.year ? Number(data.year) : 0,
      currentReading: data.current_reading ? Number(data.current_reading) : 0,
      previousReading: data.previous_reading
        ? Number(data.previous_reading)
        : 0,
      readingValue: data.reading_value ? Number(data.reading_value) : 0,
      consumption: data.consumption ? Number(data.consumption) : 0,
      monthDue: data.month_due ? String(data.month_due).trim() : '',
      yearDue: data.year_due ? Number(data.year_due) : 0,
      readingStatus: data.reading_status
        ? String(data.reading_status).trim()
        : '',
      paymentDate: data.payment_date ? new Date(data.payment_date) : null,
      trashRate: data.trash_rate ? Number(data.trash_rate) : 0,
      epaaValue: data.epaa_value ? Number(data.epaa_value) : 0,
      thirdPartyValue: data.third_party_value
        ? Number(data.third_party_value)
        : 0,
      balanceInFavor: data.balance_in_favor ? Number(data.balance_in_favor) : 0,
      balanceAgainst: data.balance_against ? Number(data.balance_against) : 0,
      discountTrashRate: data.discount_trash_rate
        ? Number(data.discount_trash_rate)
        : 0,
      surcharge: data.surcharge ? Number(data.surcharge) : 0,
      adjustedTotal: data.adjusted_total ? Number(data.adjusted_total) : 0,
      total: data.total ? Number(data.total) : 0,
      trashRatePrevious: data.trash_rate_previous
        ? Number(data.trash_rate_previous)
        : 0,
      dueDate: data.due_date ? new Date(data.due_date) : null,
      incomeStatus: data.income_status ? String(data.income_status).trim() : '',
      incomeDate: data.income_date ? new Date(data.income_date) : null,
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
}
