import { Module } from '@nestjs/common';
import { LegacyAnalyticsController } from '../controllers/legacy-analytics.controller';
import { LegacyAnalyticsSQLServer2000Persistence } from '../repositories/sqlserver/persistence/legacy-analytics-sqlserver2000.persistence';

import { GetLegacyExecutiveDashboardAnalyticsUseCase } from '../../application/usecases/GetLegacyExecutiveDashboardAnalyticsUseCase';
import { GetLegacySectorPerformanceAnalyticsUseCase } from '../../application/usecases/GetLegacySectorPerformanceAnalyticsUseCase';
import { GetLegacyMonthlyTrendAnalyticsUseCase } from '../../application/usecases/GetLegacyMonthlyTrendAnalyticsUseCase';
import { GetLegacyNoveltyEconomicImpactAnalyticsUseCase } from '../../application/usecases/GetLegacyNoveltyEconomicImpactAnalyticsUseCase';
import { GetLegacyTopConsumersAnalyticsUseCase } from '../../application/usecases/GetLegacyTopConsumersAnalyticsUseCase';
import { GetLegacyInterannualComparisonAnalyticsUseCase } from '../../application/usecases/GetLegacyInterannualComparisonAnalyticsUseCase';
import { GetLegacyMonthlyConnectionGrowthAnalyticsUseCase } from '../../application/usecases/GetLegacyMonthlyConnectionGrowthAnalyticsUseCase';
import { GetLegacyAnnualTrendAnalyticsUseCase } from '../../application/usecases/GetLegacyAnnualTrendAnalyticsUseCase';
import { DatabasePersistenceModule } from '../../../../shared/connections/database/database-persistence.module';

@Module({
  imports: [DatabasePersistenceModule],
  controllers: [LegacyAnalyticsController],
  providers: [
    GetLegacyExecutiveDashboardAnalyticsUseCase,
    GetLegacySectorPerformanceAnalyticsUseCase,
    GetLegacyMonthlyTrendAnalyticsUseCase,
    GetLegacyNoveltyEconomicImpactAnalyticsUseCase,
    GetLegacyTopConsumersAnalyticsUseCase,
    GetLegacyInterannualComparisonAnalyticsUseCase,
    GetLegacyMonthlyConnectionGrowthAnalyticsUseCase,
    GetLegacyAnnualTrendAnalyticsUseCase,
    {
      provide: 'LegacyAnalyticsRepository',
      useClass: LegacyAnalyticsSQLServer2000Persistence,
    },
  ],
  exports: [
    GetLegacyExecutiveDashboardAnalyticsUseCase,
    GetLegacySectorPerformanceAnalyticsUseCase,
    GetLegacyMonthlyTrendAnalyticsUseCase,
    GetLegacyNoveltyEconomicImpactAnalyticsUseCase,
    GetLegacyTopConsumersAnalyticsUseCase,
    GetLegacyInterannualComparisonAnalyticsUseCase,
    GetLegacyMonthlyConnectionGrowthAnalyticsUseCase,
    GetLegacyAnnualTrendAnalyticsUseCase,
    'LegacyAnalyticsRepository',
  ],
})
export class LegacyAnalyticsSQLServer2000Module {}
