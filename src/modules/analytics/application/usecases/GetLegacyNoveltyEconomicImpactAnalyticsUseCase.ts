import { Inject, Injectable } from '@nestjs/common';
import { InterfaceLegacyAnalyticsRepository } from '../../domain/contracts/legacy-analytics.interface.repository';
import { LegacyNoveltyImpactFilterRequest } from '../dtos/request/legacy-novelty-impact-filter.request';
import { LegacyNoveltyEconomicImpactResponse } from '../dtos/response/legacy-novelty-impact.response';
import { LegacyAnalyticsMapper } from '../mappers/legacy-analytics.mapper';

@Injectable()
export class GetLegacyNoveltyEconomicImpactAnalyticsUseCase {
  constructor(
    @Inject('LegacyAnalyticsRepository')
    private readonly analyticsRepository: InterfaceLegacyAnalyticsRepository,
  ) {}

  async execute(
    request: LegacyNoveltyImpactFilterRequest,
  ): Promise<LegacyNoveltyEconomicImpactResponse[]> {
    const models = await this.analyticsRepository.getNoveltyEconomicImpact({
      year: request.year,
      month: request.month,
      sector: request.sector,
    });
    return LegacyAnalyticsMapper.toNoveltyEconomicImpactResponseList(models);
  }
}
