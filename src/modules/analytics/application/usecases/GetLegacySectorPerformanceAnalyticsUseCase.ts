import { Inject, Injectable } from '@nestjs/common';
import { InterfaceLegacyAnalyticsRepository } from '../../domain/contracts/legacy-analytics.interface.repository';
import { LegacySectorPerformanceFilterRequest } from '../dtos/request/legacy-sector-performance-filter.request';
import { LegacySectorPerformanceResponse } from '../dtos/response/legacy-sector-performance.response';
import { LegacyAnalyticsMapper } from '../mappers/legacy-analytics.mapper';

@Injectable()
export class GetLegacySectorPerformanceAnalyticsUseCase {
  constructor(
    @Inject('LegacyAnalyticsRepository')
    private readonly analyticsRepository: InterfaceLegacyAnalyticsRepository,
  ) {}

  async execute(
    request: LegacySectorPerformanceFilterRequest,
  ): Promise<LegacySectorPerformanceResponse[]> {
    const models = await this.analyticsRepository.getSectorPerformance({
      year: request.year,
      month: request.month,
      sector: request.sector,
      sortBy: request.sortBy,
    });
    return LegacyAnalyticsMapper.toSectorPerformanceResponseList(models);
  }
}
