import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetLegacyExecutiveDashboardAnalyticsUseCase } from '../../application/usecases/GetLegacyExecutiveDashboardAnalyticsUseCase';
import { GetLegacySectorPerformanceAnalyticsUseCase } from '../../application/usecases/GetLegacySectorPerformanceAnalyticsUseCase';
import { GetLegacyMonthlyTrendAnalyticsUseCase } from '../../application/usecases/GetLegacyMonthlyTrendAnalyticsUseCase';
import { GetLegacyNoveltyEconomicImpactAnalyticsUseCase } from '../../application/usecases/GetLegacyNoveltyEconomicImpactAnalyticsUseCase';
import { GetLegacyTopConsumersAnalyticsUseCase } from '../../application/usecases/GetLegacyTopConsumersAnalyticsUseCase';
import { GetLegacyInterannualComparisonAnalyticsUseCase } from '../../application/usecases/GetLegacyInterannualComparisonAnalyticsUseCase';
import { GetLegacyMonthlyConnectionGrowthAnalyticsUseCase } from '../../application/usecases/GetLegacyMonthlyConnectionGrowthAnalyticsUseCase';
import { GetLegacyAnnualTrendAnalyticsUseCase } from '../../application/usecases/GetLegacyAnnualTrendAnalyticsUseCase';

import { LegacyExecutiveDashboardFilterRequest } from '../../application/dtos/request/legacy-executive-dashboard-filter.request';
import { LegacySectorPerformanceFilterRequest } from '../../application/dtos/request/legacy-sector-performance-filter.request';
import { LegacyMonthlyTrendFilterRequest } from '../../application/dtos/request/legacy-monthly-trend-filter.request';
import { LegacyNoveltyImpactFilterRequest } from '../../application/dtos/request/legacy-novelty-impact-filter.request';
import { LegacyTopConsumersFilterRequest } from '../../application/dtos/request/legacy-top-consumers-filter.request';
import { LegacyInterannualComparisonFilterRequest } from '../../application/dtos/request/legacy-interannual-comparison-filter.request';
import { LegacyMonthlyConnectionGrowthFilterRequest } from '../../application/dtos/request/legacy-monthly-connection-growth-filter.request';
import { LegacyAnnualTrendFilterRequest } from '../../application/dtos/request/legacy-annual-trend-filter.request';

import { LegacyExecutiveDashboardResponse } from '../../application/dtos/response/legacy-executive-dashboard.response';
import { LegacySectorPerformanceResponse } from '../../application/dtos/response/legacy-sector-performance.response';
import { LegacyMonthlyTrendResponse } from '../../application/dtos/response/legacy-monthly-trend.response';
import { LegacyNoveltyEconomicImpactResponse } from '../../application/dtos/response/legacy-novelty-impact.response';
import { LegacyTopConsumerResponse } from '../../application/dtos/response/legacy-top-consumer.response';
import { LegacyInterannualComparisonResponse } from '../../application/dtos/response/legacy-interannual-comparison.response';
import { LegacyMonthlyConnectionGrowthResponse } from '../../application/dtos/response/legacy-monthly-connection-growth.response';
import { LegacyAnnualTrendResponse } from '../../application/dtos/response/legacy-annual-trend.response';

@Controller('legacy-analytics')
export class LegacyAnalyticsController {
  constructor(
    private readonly getExecutiveDashboardUseCase: GetLegacyExecutiveDashboardAnalyticsUseCase,
    private readonly getSectorPerformanceUseCase: GetLegacySectorPerformanceAnalyticsUseCase,
    private readonly getMonthlyTrendUseCase: GetLegacyMonthlyTrendAnalyticsUseCase,
    private readonly getNoveltyImpactUseCase: GetLegacyNoveltyEconomicImpactAnalyticsUseCase,
    private readonly getTopConsumersUseCase: GetLegacyTopConsumersAnalyticsUseCase,
    private readonly getInterannualComparisonUseCase: GetLegacyInterannualComparisonAnalyticsUseCase,
    private readonly getMonthlyConnectionGrowthUseCase: GetLegacyMonthlyConnectionGrowthAnalyticsUseCase,
    private readonly getAnnualTrendUseCase: GetLegacyAnnualTrendAnalyticsUseCase,
  ) {}

  @MessagePattern('epaa-legacy.analytics.executive-dashboard')
  async getExecutiveDashboard(
    @Payload() payload: LegacyExecutiveDashboardFilterRequest | string,
  ): Promise<LegacyExecutiveDashboardResponse> {
    const request: LegacyExecutiveDashboardFilterRequest =
      typeof payload === 'string'
        ? { month: payload.replace(/['"]+/g, '') }
        : payload ?? {};
    return this.getExecutiveDashboardUseCase.execute(request);
  }

  @MessagePattern('epaa-legacy.analytics.sector-performance')
  async getSectorPerformance(
    @Payload() payload: LegacySectorPerformanceFilterRequest | string,
  ): Promise<LegacySectorPerformanceResponse[]> {
    const request: LegacySectorPerformanceFilterRequest =
      typeof payload === 'string'
        ? { month: payload.replace(/['"]+/g, '') }
        : payload ?? {};
    return this.getSectorPerformanceUseCase.execute(request);
  }

  @MessagePattern('epaa-legacy.analytics.monthly-trend')
  async getMonthlyTrend(
    @Payload() payload: LegacyMonthlyTrendFilterRequest | number,
  ): Promise<LegacyMonthlyTrendResponse[]> {
    const request: LegacyMonthlyTrendFilterRequest =
      typeof payload === 'number'
        ? { year: payload }
        : payload ?? {};
    return this.getMonthlyTrendUseCase.execute(request);
  }

  @MessagePattern('epaa-legacy.analytics.novelty-economic-impact')
  async getNoveltyEconomicImpact(
    @Payload() payload: LegacyNoveltyImpactFilterRequest | string,
  ): Promise<LegacyNoveltyEconomicImpactResponse[]> {
    const request: LegacyNoveltyImpactFilterRequest =
      typeof payload === 'string'
        ? { month: payload.replace(/['"]+/g, '') }
        : payload ?? {};
    return this.getNoveltyImpactUseCase.execute(request);
  }

  @MessagePattern('epaa-legacy.analytics.top-consumers')
  async getTopConsumers(
    @Payload() payload: LegacyTopConsumersFilterRequest | string,
  ): Promise<LegacyTopConsumerResponse[]> {
    const request: LegacyTopConsumersFilterRequest =
      typeof payload === 'string'
        ? { month: payload.replace(/['"]+/g, '') }
        : payload ?? {};
    return this.getTopConsumersUseCase.execute(request);
  }

  @MessagePattern('epaa-legacy.analytics.interannual-comparison')
  async getInterannualComparison(
    @Payload() payload: LegacyInterannualComparisonFilterRequest,
  ): Promise<LegacyInterannualComparisonResponse[]> {
    return this.getInterannualComparisonUseCase.execute(payload ?? {});
  }

  @MessagePattern('epaa-legacy.analytics.monthly-connection-growth')
  async getMonthlyConnectionGrowth(
    @Payload() payload: LegacyMonthlyConnectionGrowthFilterRequest,
  ): Promise<LegacyMonthlyConnectionGrowthResponse[]> {
    return this.getMonthlyConnectionGrowthUseCase.execute(payload ?? {});
  }

  @MessagePattern('epaa-legacy.analytics.annual-trend')
  async getAnnualTrend(
    @Payload() payload: LegacyAnnualTrendFilterRequest,
  ): Promise<LegacyAnnualTrendResponse[]> {
    return this.getAnnualTrendUseCase.execute(payload ?? {});
  }
}
