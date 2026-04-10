import { Module } from '@nestjs/common';
import { ReadingModuleUsingSQLServer2000 } from '../../modules/readings/infrastructure/modules/reading.module';
import { TrashRateReportSQLServer2000Module } from '../../modules/trash/infrastructure/modules/sqlserver/trash-rate-report.sqlserver2000.response';
import { AccountingModuleUsingSQLServer2000 } from '../../modules/accounting/infrastructure/modules/sqlserver/accounting.sqlserver2000.module';

@Module({
  imports: [
    ReadingModuleUsingSQLServer2000,
    TrashRateReportSQLServer2000Module,
    AccountingModuleUsingSQLServer2000,
  ],
})
export class ModulesUsingSQLServer2000Module {}
