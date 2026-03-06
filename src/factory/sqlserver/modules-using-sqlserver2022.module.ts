import { Module } from '@nestjs/common';
import { ReadingModuleUsingSQLServer2022 } from '../../modules/readings/infrastructure/modules/reading-sqlserver2022.module';
import { TrashRateReportSQLServer2022Module } from '../../modules/trash/infrastructure/modules/sqlserver/trash-rate-report.sqlserver2022.response';

@Module({
  imports: [
    ReadingModuleUsingSQLServer2022,
    TrashRateReportSQLServer2022Module,
  ],
})
export class ModulesUsingSQLServer2022Module {}
