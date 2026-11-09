import { Inject, Injectable } from '@nestjs/common';
import { InterfaceLegacyAnalyticsRepository } from '../../domain/contracts/legacy-analytics.interface.repository';
import { LegacyMonthlyTrendFilterRequest } from '../dtos/request/legacy-monthly-trend-filter.request';
import { LegacyMonthlyTrendResponse } from '../dtos/response/legacy-monthly-trend.response';
import { LegacyAnalyticsMapper } from '../mappers/legacy-analytics.mapper';

@Injectable()
export class GetLegacyMonthlyTrendAnalyticsUseCase {
  constructor(
    @Inject('LegacyAnalyticsRepository')
    private readonly analyticsRepository: InterfaceLegacyAnalyticsRepository,
  ) {}

  async execute(
    request: LegacyMonthlyTrendFilterRequest,
  ): Promise<LegacyMonthlyTrendResponse[]> {
    const models = await this.analyticsRepository.getMonthlyTrend({
      year: request.year,
      startMonthNumber: request.startMonthNumber,
      endMonthNumber: request.endMonthNumber,
      sector: request.sector,
    });
    return LegacyAnalyticsMapper.toMonthlyTrendResponseList(models);
  }
}
