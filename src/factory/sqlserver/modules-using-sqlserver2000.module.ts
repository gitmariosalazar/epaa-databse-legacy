import { Module } from '@nestjs/common';
import { ReadingModuleUsingSQLServer2000 } from '../../modules/readings/infrastructure/modules/reading.module';
import { TrashRateReportSQLServer2000Module } from '../../modules/trash/infrastructure/modules/sqlserver/trash-rate-report.sqlserver2000.response';

@Module({
  imports: [
    ReadingModuleUsingSQLServer2000,
    TrashRateReportSQLServer2000Module,
  ],
})
export class ModulesUsingSQLServer2000Module {}
