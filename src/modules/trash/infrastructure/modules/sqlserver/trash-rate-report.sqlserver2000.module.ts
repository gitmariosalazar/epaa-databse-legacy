import { Module } from '@nestjs/common';
import { TrashRateReportController } from '../../controllers/trash-rate-report.controller';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { SqlServerTrash2000RateReportPersistence } from '../../repositories/sqlserver/persistence/sql-server-2000.trash-rate-report.persistence';
import { GetClientTrashDetailRowUseCase } from '../../../application/usecases/reports/GetClientTrashDetailRowUseCase';
import { GetCreditNoteRowUseCase } from '../../../application/usecases/reports/GetCreditNoteRowUseCase';
import { GetMissingValorRowUseCase } from '../../../application/usecases/reports/GetMissingValorRowUseCase';
import { GetMonthlySummaryRowUseCase } from '../../../application/usecases/reports/GetMonthlySummaryRowUseCase';
import { GetTopDebtorRowUseCase } from '../../../application/usecases/reports/GetTopDebtorRowUseCase';
import { GetTrashDashboardKpiUseCase } from '../../../application/usecases/reports/GetTrashDashboardKpiUseCase';
import { GetTrashRateAuditRowUseCase } from '../../../application/usecases/reports/GetTrashRateAuditRowUseCase';
import { GetTrashRateKPIUseCase } from '../../../application/usecases/reports/GetTrashRateKPIUseCase';
import { GetDailyCollectorDetailUseCase } from '../../../application/usecases/reports/GetDailyCollectorDetailUseCase';
import { GetCollectorPerformanceKPIUseCase } from '../../../application/usecases/reports/GetCollectorPerformanceKPIUseCase';

@Module({
  imports: [DatabasePersistenceModule],
  controllers: [TrashRateReportController],
  providers: [
    GetClientTrashDetailRowUseCase,
    GetCreditNoteRowUseCase,
    GetMissingValorRowUseCase,
    GetMonthlySummaryRowUseCase,
    GetTopDebtorRowUseCase,
    GetTrashDashboardKpiUseCase,
    GetTrashRateAuditRowUseCase,
    GetTrashRateKPIUseCase,
    GetDailyCollectorDetailUseCase,
    GetCollectorPerformanceKPIUseCase,
    {
      provide: 'TrashRateReportRepository',
      useClass: SqlServerTrash2000RateReportPersistence,
    },
  ],
  exports: [],
})
export class TrashRateReportSQLServer2000Module {}
