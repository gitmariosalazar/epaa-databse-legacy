import { Injectable, Inject } from '@nestjs/common';
import { InterfaceTrashRateReportRepository } from '../../../domain/contracts/trash-rate-report.interface.repository';
import { TrashDashboardKpiModel } from '../../../domain/models/trash-rate-report.model';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../settings/environments/status-code';

@Injectable()
export class GetTrashDashboardKpiUseCase {
  constructor(
    @Inject('TrashRateReportRepository')
    private readonly trashRateReportRepository: InterfaceTrashRateReportRepository,
  ) {}

  async execute(
    startDate: string,
    endDate: string,
  ): Promise<TrashDashboardKpiModel[]> {
    const modelResult: TrashDashboardKpiModel[] =
      await this.trashRateReportRepository.getDashboardKPITrashRate(
        startDate,
        endDate,
      );

    if (modelResult.length === 0) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `No results found for the given start date ${startDate} and end date ${endDate}`,
      });
    }

    return modelResult;
  }
}
