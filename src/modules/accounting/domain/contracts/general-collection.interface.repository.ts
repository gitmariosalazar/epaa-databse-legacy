import {
  GeneralCollectionsParams,
  GeneralTrendCollectionsParams,
} from '../schemas/dto/request/general-collection.params';
import {
  GeneralCollectionResponse,
  GeneralDailyGroupedReportResponse,
  GeneralYearlyGroupedReportResponse,
  GeneralMonthlyGroupedReportResponse,
  GeneralKPIResponse,
  GeneralYearlyKPIResponse,
  GeneralMonthlyKPIResponse,
} from '../schemas/dto/response/general-collection.response';

export interface InterfaceGeneralCollectionRepository {
  getGeneralCollectionKPI(
    params: GeneralCollectionsParams,
  ): Promise<GeneralKPIResponse | null>;

  getGeneralCollectionReport(
    params: GeneralCollectionsParams,
  ): Promise<GeneralCollectionResponse[]>;

  getGeneralDailyCollectionGroupedReport(
    params: GeneralCollectionsParams,
  ): Promise<GeneralDailyGroupedReportResponse[]>;

  getGeneralYearlyCollectionGroupedReport(
    params: GeneralTrendCollectionsParams,
  ): Promise<GeneralYearlyGroupedReportResponse[]>;

  getGeneralMonthlyCollectionGroupedReport(
    params: GeneralTrendCollectionsParams,
  ): Promise<GeneralMonthlyGroupedReportResponse[]>;

  getGeneralYearlyCollectionKPI(
    params: GeneralTrendCollectionsParams,
  ): Promise<GeneralYearlyKPIResponse[]>;

  getGeneralMonthlyCollectionKPI(
    params: GeneralTrendCollectionsParams,
  ): Promise<GeneralMonthlyKPIResponse[]>;
}
