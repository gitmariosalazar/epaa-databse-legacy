import { Module } from '@nestjs/common';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { TrashRateReportController } from '../../controllers/trash-rate-report.controller';
import { DatabaseServiceSQLServer2022 } from '../../../../../shared/connections/database/sqlserver/sqlserver-2022.service';
import { SqlServer2022TrashRateReportPersistence } from '../../repositories/sqlserver/persistence/sql-server-2022.trash-rate-report.persistence';
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
  imports: [KafkaServiceModule],
  controllers: [TrashRateReportController],
  providers: [
    DatabaseServiceSQLServer2022,
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
      useClass: SqlServer2022TrashRateReportPersistence,
    },
  ],
  exports: [],
})
export class TrashRateReportSQLServer2022Module {}
