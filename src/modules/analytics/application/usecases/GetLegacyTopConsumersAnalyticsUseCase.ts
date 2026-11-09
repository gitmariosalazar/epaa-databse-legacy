import { Inject, Injectable } from '@nestjs/common';
import { InterfaceLegacyAnalyticsRepository } from '../../domain/contracts/legacy-analytics.interface.repository';
import { LegacyTopConsumersFilterRequest } from '../dtos/request/legacy-top-consumers-filter.request';
import { LegacyTopConsumerResponse } from '../dtos/response/legacy-top-consumer.response';
import { LegacyAnalyticsMapper } from '../mappers/legacy-analytics.mapper';

@Injectable()
export class GetLegacyTopConsumersAnalyticsUseCase {
  constructor(
    @Inject('LegacyAnalyticsRepository')
    private readonly analyticsRepository: InterfaceLegacyAnalyticsRepository,
  ) {}

  async execute(
    request: LegacyTopConsumersFilterRequest,
  ): Promise<LegacyTopConsumerResponse[]> {
    const models = await this.analyticsRepository.getTopConsumers({
      year: request.year,
      month: request.month,
      sector: request.sector,
      limit: request.limit,
      minConsumptionM3: request.minConsumptionM3,
      novelty: request.novelty,
    });
    return LegacyAnalyticsMapper.toTopConsumerResponseList(models);
  }
}
