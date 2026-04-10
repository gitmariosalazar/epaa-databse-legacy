import { GeneralCollectionsParams } from '../../domain/schemas/dto/request/general-collection.params';
import {
  GeneralCollectionResponse,
  GeneralDailyGroupedReportResponse,
  GeneralKPIResponse,
} from '../../domain/schemas/dto/response/general-collection.response';

export interface InterfaceGeneralCollectionUseCase {
  getGeneralCollectionKPI(
    params: GeneralCollectionsParams,
  ): Promise<GeneralKPIResponse | null>;

  getGeneralCollectionReport(
    params: GeneralCollectionsParams,
  ): Promise<GeneralCollectionResponse[]>;

  getGeneralDailyCollectionGroupedReport(
    params: GeneralCollectionsParams,
  ): Promise<GeneralDailyGroupedReportResponse[]>;
}
