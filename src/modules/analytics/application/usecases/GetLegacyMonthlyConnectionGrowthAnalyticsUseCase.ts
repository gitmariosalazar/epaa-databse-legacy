import { Inject, Injectable } from '@nestjs/common';
import { InterfaceLegacyAnalyticsRepository } from '../../domain/contracts/legacy-analytics.interface.repository';
import { LegacyMonthlyConnectionGrowthFilterRequest } from '../dtos/request/legacy-monthly-connection-growth-filter.request';
import { LegacyMonthlyConnectionGrowthResponse } from '../dtos/response/legacy-monthly-connection-growth.response';
import { LegacyAnalyticsMapper } from '../mappers/legacy-analytics.mapper';

@Injectable()
export class GetLegacyMonthlyConnectionGrowthAnalyticsUseCase {
  constructor(
    @Inject('LegacyAnalyticsRepository')
    private readonly analyticsRepository: InterfaceLegacyAnalyticsRepository,
  ) {}

  async execute(
    request: LegacyMonthlyConnectionGrowthFilterRequest,
  ): Promise<LegacyMonthlyConnectionGrowthResponse[]> {
    const models = await this.analyticsRepository.getMonthlyConnectionGrowth({
      baseYear: request.baseYear,
      targetYear: request.targetYear,
    });
    return LegacyAnalyticsMapper.toMonthlyConnectionGrowthResponseList(models);
  }
}
