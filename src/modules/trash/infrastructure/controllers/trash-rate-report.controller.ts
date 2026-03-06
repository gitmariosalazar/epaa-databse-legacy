import { Controller, Get } from '@nestjs/common';
import { GetTrashRateAuditRowUseCase } from '../../application/usecases/reports/GetTrashRateAuditRowUseCase';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetTrashDashboardKpiUseCase } from '../../application/usecases/reports/GetTrashDashboardKpiUseCase';
import { GetCreditNoteRowUseCase } from '../../application/usecases/reports/GetCreditNoteRowUseCase';
import { GetMissingValorRowUseCase } from '../../application/usecases/reports/GetMissingValorRowUseCase';
import { GetMonthlySummaryRowUseCase } from '../../application/usecases/reports/GetMonthlySummaryRowUseCase';
import { GetTopDebtorRowUseCase } from '../../application/usecases/reports/GetTopDebtorRowUseCase';
import { GetClientTrashDetailRowUseCase } from '../../application/usecases/reports/GetClientTrashDetailRowUse';

@Controller('trash-rate-report')
export class TrashRateReportController {
  constructor(
    private readonly getTrashRateAuditReportUseCase: GetTrashRateAuditRowUseCase,
    private readonly getCreditNotesUseCase: GetCreditNoteRowUseCase,
    private readonly getMissingValorRecordsUseCase: GetMissingValorRowUseCase,
    private readonly getMonthlySummaryUseCase: GetMonthlySummaryRowUseCase,
    private readonly getTopDebtorsUseCase: GetTopDebtorRowUseCase,
    private readonly getTrashDashboardKpiUseCase: GetTrashDashboardKpiUseCase,
    private readonly getClientTrashDetailUseCase: GetClientTrashDetailRowUseCase,
  ) {}

  @MessagePattern('trash-rate-audit-report')
  async getTrashRateAuditReport(
    @Payload()
    payload: {
      startDate: string;
      endDate: string;
      limit: number;
      offset: number;
    },
  ) {
    return this.getTrashRateAuditReportUseCase.execute(
      payload.startDate,
      payload.endDate,
      payload.limit ?? 100,
      payload.offset ?? 0,
    );
  }

  @MessagePattern('credit-notes')
  async getCreditNotes(
    @Payload() payload: { startDate: string; limit: number; offset: number },
  ) {
    return this.getCreditNotesUseCase.execute(
      payload.startDate,
      payload.limit ?? 100,
      payload.offset ?? 0,
    );
  }

  @MessagePattern('missing-valor-records')
  async getMissingValorRecords(
    @Payload() payload: { startDate: string; endDate: string },
  ) {
    return this.getMissingValorRecordsUseCase.execute(
      payload.startDate,
      payload.endDate,
    );
  }

  @MessagePattern('monthly-summary')
  async getMonthlySummary(
    @Payload() payload: { startDate: string; endDate: string },
  ) {
    return this.getMonthlySummaryUseCase.execute(
      payload.startDate,
      payload.endDate,
    );
  }

  @MessagePattern('top-debtors')
  async getTopDebtors(
    @Payload() payload: { startDate: string; endDate: string; top: number },
  ) {
    return this.getTopDebtorsUseCase.execute(
      payload.startDate,
      payload.endDate,
      payload.top,
    );
  }

  @MessagePattern('trash-dashboard-kpi')
  async getTrashDashboardKpi(
    @Payload() payload: { startDate: string; endDate: string },
  ) {
    return this.getTrashDashboardKpiUseCase.execute(
      payload.startDate,
      payload.endDate,
    );
  }

  @MessagePattern('client-trash-detail')
  async getClientTrashDetail(@Payload() payload: { searchParams: string }) {
    return this.getClientTrashDetailUseCase.execute(payload.searchParams);
  }
}
