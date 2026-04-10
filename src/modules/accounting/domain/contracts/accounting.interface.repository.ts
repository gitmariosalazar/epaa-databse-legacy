import {
  MonthlyDebtSummaryResponse,
  OverduePaymentResponse,
  OverdueSummaryResponse,
  PaymentReadingResponse,
  PaymentResponse,
  PendingReadingResponse,
  YearlyOverdueSummaryResponse,
} from '../schemas/dto/response/accounting.response';

export interface InterfaceAccountingRepository {
  findAllPaymentReadingPayrollsByDate(
    paymentDate: string,
  ): Promise<PaymentReadingResponse[]>;

  findAllPaymentByDateAndOrderValue(
    paymentDate: string,
    orderValue: number,
  ): Promise<PaymentResponse[]>;

  findAllPaymentByDate(paymentDate: string): Promise<PaymentResponse[]>;

  findAllPaymentByInitDateAndEndDate(
    initDate: string,
    endDate: string,
    limit?: number,
    offset?: number,
  ): Promise<PaymentResponse[]>;

  findAllOverduePayments(
    limit?: number,
    offset?: number,
  ): Promise<OverduePaymentResponse[]>;

  findOverdueSummary(): Promise<OverdueSummaryResponse | null>;
  findYearlyOverdueSummary(): Promise<YearlyOverdueSummaryResponse[]>;
  findMonthlyDebtSummary(): Promise<MonthlyDebtSummaryResponse[]>;

  findPendingReadingsByCadastralKey(
    cadastralKey: string,
  ): Promise<PendingReadingResponse[]>;

  findPendingReadingsByCardId(cardId: string): Promise<PendingReadingResponse[]>;

  findPendingReadingsByCadastralKeyOrCardId(
    searchValue: string,
  ): Promise<PendingReadingResponse[]>;

  findPendingReadingsByCadastralKeyOrCardIdAll(
    searchValue: string,
  ): Promise<PendingReadingResponse[]>;

  verifyReadingExists(searchValue: string): Promise<boolean>;
}
