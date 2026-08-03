import { Module } from '@nestjs/common';
import { ReadingSQLServer2000Module } from '../../modules/readings/infrastructure/modules/reading.sqlserver2000.module';
import { TrashRateReportSQLServer2000Module } from '../../modules/trash/infrastructure/modules/sqlserver/trash-rate-report.sqlserver2000.module';
import { AccountingModuleUsingSQLServer2000 } from '../../modules/accounting/infrastructure/modules/sqlserver/accounting.sqlserver2000.module';
import { MigrationSQLServer2000Module } from '../../modules/migration/infrastructure/modules/migration.sqlserver2000.module';

@Module({
  imports: [
    ReadingSQLServer2000Module,
    TrashRateReportSQLServer2000Module,
    AccountingModuleUsingSQLServer2000,
    MigrationSQLServer2000Module,
  ],
})
export class AppLegacyModulesUsingSQLServer2000 {}
