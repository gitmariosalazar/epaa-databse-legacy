import { Module } from '@nestjs/common';
import { ReadingSQLServer2022Module } from '../../modules/readings/infrastructure/modules/reading-sqlserver2022.module';
import { TrashRateReportSQLServer2022Module } from '../../modules/trash/infrastructure/modules/sqlserver/trash-rate-report.sqlserver2022.module';
import { AccountingModuleUsingSQLServer2022 } from '../../modules/accounting/infrastructure/modules/sqlserver/accounting.sqlserver2022.module';
import { MigrationSQLServer2022Module } from '../../modules/migration/infrastructure/modules/migration.sqlserver2022.module';

@Module({
  imports: [
    ReadingSQLServer2022Module,
    TrashRateReportSQLServer2022Module,
    AccountingModuleUsingSQLServer2022,
    MigrationSQLServer2022Module,
  ],
})
export class AppLegacyModulesUsingSQLServer2022 {}
