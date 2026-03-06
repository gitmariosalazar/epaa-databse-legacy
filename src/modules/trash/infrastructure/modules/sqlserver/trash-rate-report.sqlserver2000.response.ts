import { Module } from '@nestjs/common';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { TrashRateReportController } from '../../controllers/trash-rate-report.controller';
import { DatabaseServiceSQLServer2000 } from '../../../../../shared/connections/database/sqlserver/sqlserver-2000.service';
import { GetClientTrashDetailRowUseCase } from '../../../application/usecases/reports/GetClientTrashDetailRowUse';
import { GetCreditNoteRowUseCase } from '../../../application/usecases/reports/GetCreditNoteRowUseCase';
import { GetMissingValorRowUseCase } from '../../../application/usecases/reports/GetMissingValorRowUseCase';
import { GetMonthlySummaryRowUseCase } from '../../../application/usecases/reports/GetMonthlySummaryRowUseCase';
import { GetTopDebtorRowUseCase } from '../../../application/usecases/reports/GetTopDebtorRowUseCase';
import { GetTrashDashboardKpiUseCase } from '../../../application/usecases/reports/GetTrashDashboardKpiUseCase';
import { GetTrashRateAuditRowUseCase } from '../../../application/usecases/reports/GetTrashRateAuditRowUseCase';
import { SqlServerTrash2000RateReportPersistence } from '../../repositories/sqlserver/persistence/sql-server-2000.trash-rate-report.persistence';

@Module({
  imports: [KafkaServiceModule],
  controllers: [TrashRateReportController],
  providers: [
    DatabaseServiceSQLServer2000,
    GetClientTrashDetailRowUseCase,
    GetCreditNoteRowUseCase,
    GetMissingValorRowUseCase,
    GetMonthlySummaryRowUseCase,
    GetTopDebtorRowUseCase,
    GetTrashDashboardKpiUseCase,
    GetTrashRateAuditRowUseCase,
    {
      provide: 'TrashRateReportRepository',
      useClass: SqlServerTrash2000RateReportPersistence,
    },
  ],
  exports: [],
})
export class TrashRateReportSQLServer2000Module {}
