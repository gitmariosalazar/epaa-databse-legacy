import { Inject, Injectable } from '@nestjs/common';
import { InterfaceLegacyAnalyticsRepository } from '../../domain/contracts/legacy-analytics.interface.repository';
import { LegacyExecutiveDashboardFilterRequest } from '../dtos/request/legacy-executive-dashboard-filter.request';
import { LegacyExecutiveDashboardResponse } from '../dtos/response/legacy-executive-dashboard.response';
import { LegacyAnalyticsMapper } from '../mappers/legacy-analytics.mapper';

@Injectable()
export class GetLegacyExecutiveDashboardAnalyticsUseCase {
  constructor(
    @Inject('LegacyAnalyticsRepository')
    private readonly analyticsRepository: InterfaceLegacyAnalyticsRepository,
  ) {}

  async execute(
    request: LegacyExecutiveDashboardFilterRequest,
  ): Promise<LegacyExecutiveDashboardResponse> {
    const model = await this.analyticsRepository.getExecutiveDashboard({
      year: request.year,
      month: request.month,
      sector: request.sector,
    });
    return LegacyAnalyticsMapper.toExecutiveDashboardResponse(model);
  }
}
