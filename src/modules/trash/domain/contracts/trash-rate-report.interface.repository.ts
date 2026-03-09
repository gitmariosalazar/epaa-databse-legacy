import { TopDebtorRowResponse } from '../../application/dtos/response/trash-rate-report.response';
import {
  TrashRateAuditRowModel,
  MonthlySummaryRowModel,
  MissingValorRowModel,
  CreditNoteRowModel,
  ClientTrashDetailRowModel,
  TopDebtorRowModel,
  TrashDashboardKpiModel,
  TrashRateKPIModel,
  CollectorPerformanceKPIModel,
  DailyCollectorDetailModel,
} from '../models/trash-rate-report.model';

export interface InterfaceTrashRateReportRepository {
  getTrashRateAuditReport(
    startDate: string,
    endDate: string,
    limit: number,
    offset: number,
  ): Promise<TrashRateAuditRowModel[]>;

  getMonthlySummaryReport(
    startDate: string,
    endDate: string,
  ): Promise<MonthlySummaryRowModel[]>;

  getMissingValorBills(
    startDate: string,
    endDate: string,
  ): Promise<MissingValorRowModel[]>;

  getActiveCreditNotes(
    startDate: string,
    limit: number,
    offset: number,
  ): Promise<CreditNoteRowModel[]>;

  getClientDetailSearch(
    searchParams: string,
  ): Promise<ClientTrashDetailRowModel[]>;

  getTopDebtorReport(
    startDate: string,
    endDate: string,
    top: number,
  ): Promise<TopDebtorRowModel[]>;

  getDashboardKPITrashRate(
    startDate: string,
    endDate: string,
  ): Promise<TrashDashboardKpiModel[]>;
  getTrashRateKPI(startDate: string, endDate): Promise<TrashRateKPIModel[]>;

  getCollectorPerformanceKPI(
    startDate: string,
    endDate: string,
  ): Promise<CollectorPerformanceKPIModel[]>;

  getDailyCollectorDetail(
    startDate: string,
    endDate: string,
  ): Promise<DailyCollectorDetailModel[]>;
}
