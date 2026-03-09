import { Inject, Injectable } from '@nestjs/common';
import { InterfaceTrashRateReportRepository } from '../../../domain/contracts/trash-rate-report.interface.repository';
import { CollectorPerformanceKPIModel } from '../../../domain/models/trash-rate-report.model';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../settings/environments/status-code';

@Injectable()
export class GetCollectorPerformanceKPIUseCase {
  constructor(
    @Inject('TrashRateReportRepository')
    private readonly trashRateReportRepository: InterfaceTrashRateReportRepository,
  ) {}

  async execute(
    startDate: string,
    endDate: string,
  ): Promise<CollectorPerformanceKPIModel[]> {
    const kpiData: CollectorPerformanceKPIModel[] =
      await this.trashRateReportRepository.getCollectorPerformanceKPI(
        startDate,
        endDate,
      );

    if (kpiData.length === 0) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `No Collector Performance KPI data found for the given date range ${startDate} to ${endDate}`,
      });
    }

    return kpiData;
  }
}
