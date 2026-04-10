import {
  DateRangeParams,
  DailyGroupedReport,
  DailyCollectorSummary,
  DailyPaymentMethodReport,
  FullBreakdownReport,
} from '../../domain/schemas/dto/response/entry-data.response';

export interface InterfaceEntryDataUseCase {
  getDailyGroupedReport(params: DateRangeParams): Promise<DailyGroupedReport[]>;
  getDailyCollectorSummary(
    params: DateRangeParams,
  ): Promise<DailyCollectorSummary[]>;
  getDailyPaymentMethodReport(
    params: DateRangeParams,
  ): Promise<DailyPaymentMethodReport[]>;
  getFullBreakdownReport(
    params: DateRangeParams,
  ): Promise<FullBreakdownReport[]>;
}
