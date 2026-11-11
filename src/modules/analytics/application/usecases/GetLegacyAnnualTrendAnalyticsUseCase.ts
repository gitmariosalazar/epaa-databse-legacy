import { Inject, Injectable } from '@nestjs/common';
import { InterfaceLegacyAnalyticsRepository } from '../../domain/contracts/legacy-analytics.interface.repository';
import { LegacyAnnualTrendFilterRequest } from '../dtos/request/legacy-annual-trend-filter.request';
import { LegacyAnnualTrendResponse } from '../dtos/response/legacy-annual-trend.response';
import { LegacyAnalyticsMapper } from '../mappers/legacy-analytics.mapper';

@Injectable()
export class GetLegacyAnnualTrendAnalyticsUseCase {
  constructor(
    @Inject('LegacyAnalyticsRepository')
    private readonly analyticsRepository: InterfaceLegacyAnalyticsRepository,
  ) {}

  async execute(
    request: LegacyAnnualTrendFilterRequest,
  ): Promise<LegacyAnnualTrendResponse[]> {
    const models = await this.analyticsRepository.getAnnualTrend({
      startYear: request.startYear,
      endYear: request.endYear,
      sector: request.sector,
      limitYears: request.limitYears,
    });
    return LegacyAnalyticsMapper.toAnnualTrendResponseList(models);
  }
}
