import { LegacyExecutiveDashboardModel } from '../schemas/model/legacy-executive-dashboard.model';
import { LegacySectorPerformanceModel } from '../schemas/model/legacy-sector-performance.model';
import { LegacyMonthlyTrendModel } from '../schemas/model/legacy-monthly-trend.model';
import { LegacyNoveltyEconomicImpactModel } from '../schemas/model/legacy-novelty-economic-impact.model';
import { LegacyTopConsumerModel } from '../schemas/model/legacy-top-consumer.model';
import { LegacyInterannualComparisonModel } from '../schemas/model/legacy-interannual-comparison.model';
import { LegacyMonthlyConnectionGrowthModel } from '../schemas/model/legacy-monthly-connection-growth.model';
import { LegacyAnnualTrendModel } from '../schemas/model/legacy-annual-trend.model';

export interface LegacyExecutiveDashboardFilter {
  year?: number;
  month?: number | string;
  sector?: number;
}

export interface LegacySectorPerformanceFilter {
  year?: number;
  month?: number | string;
  sector?: number;
  sortBy?: 'revenue' | 'volume' | 'readings' | 'sector';
}

export interface LegacyMonthlyTrendFilter {
  year?: number;
  startMonthNumber?: number;
  endMonthNumber?: number;
  sector?: number;
}

export interface LegacyNoveltyEconomicImpactFilter {
  year?: number;
  month?: number | string;
  sector?: number;
}

export interface LegacyTopConsumersFilter {
  year?: number;
  month?: number | string;
  sector?: number;
  limit?: number;
  minConsumptionM3?: number;
  novelty?: string;
}

export interface LegacyInterannualComparisonFilter {
  baseYear?: number;
  targetYear?: number;
  startMonthNumber?: number;
  endMonthNumber?: number;
  sector?: number;
  onlyHomologous?: boolean;
}

export interface LegacyMonthlyConnectionGrowthFilter {
  baseYear?: number;
  targetYear?: number;
}

export interface LegacyAnnualTrendFilter {
  startYear?: number;
  endYear?: number;
  sector?: number;
  limitYears?: number;
}

export interface InterfaceLegacyAnalyticsRepository {
  getExecutiveDashboard(filter: LegacyExecutiveDashboardFilter): Promise<LegacyExecutiveDashboardModel>;
  getSectorPerformance(filter: LegacySectorPerformanceFilter): Promise<LegacySectorPerformanceModel[]>;
  getMonthlyTrend(filter: LegacyMonthlyTrendFilter): Promise<LegacyMonthlyTrendModel[]>;
  getAnnualTrend(filter: LegacyAnnualTrendFilter): Promise<LegacyAnnualTrendModel[]>;
  getNoveltyEconomicImpact(filter: LegacyNoveltyEconomicImpactFilter): Promise<LegacyNoveltyEconomicImpactModel[]>;
  getTopConsumers(filter: LegacyTopConsumersFilter): Promise<LegacyTopConsumerModel[]>;
  getInterannualComparison(filter: LegacyInterannualComparisonFilter): Promise<LegacyInterannualComparisonModel[]>;
  getMonthlyConnectionGrowth(filter: LegacyMonthlyConnectionGrowthFilter): Promise<LegacyMonthlyConnectionGrowthModel[]>;
}
