import { Inject, Injectable } from '@nestjs/common';
import { InterfaceLegacyAnalyticsRepository } from '../../domain/contracts/legacy-analytics.interface.repository';
import { LegacyInterannualComparisonFilterRequest } from '../dtos/request/legacy-interannual-comparison-filter.request';
import { LegacyInterannualComparisonResponse } from '../dtos/response/legacy-interannual-comparison.response';
import { LegacyAnalyticsMapper } from '../mappers/legacy-analytics.mapper';

@Injectable()
export class GetLegacyInterannualComparisonAnalyticsUseCase {
  constructor(
    @Inject('LegacyAnalyticsRepository')
    private readonly analyticsRepository: InterfaceLegacyAnalyticsRepository,
  ) {}

  async execute(
    request: LegacyInterannualComparisonFilterRequest,
  ): Promise<LegacyInterannualComparisonResponse[]> {
    const models = await this.analyticsRepository.getInterannualComparison({
      baseYear: request.baseYear,
      targetYear: request.targetYear,
      startMonthNumber: request.startMonthNumber,
      endMonthNumber: request.endMonthNumber,
      sector: request.sector,
      onlyHomologous: request.onlyHomologous,
    });
    return LegacyAnalyticsMapper.toInterannualComparisonResponseList(models);
  }
}
