import { Inject, Injectable } from '@nestjs/common';
import { TrashRateKPIResponse } from '../../dtos/response/trash-rate-report.response';
import { InterfaceTrashRateReportRepository } from '../../../domain/contracts/trash-rate-report.interface.repository';
import { TrashRateKPIModel } from '../../../domain/models/trash-rate-report.model';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../settings/environments/status-code';

@Injectable()
export class GetTrashRateKPIUseCase {
  constructor(
    @Inject('TrashRateReportRepository')
    private readonly trashRateReportRepository: InterfaceTrashRateReportRepository,
  ) {}

  async execute(
    startDate: string,
    endDate: string,
  ): Promise<TrashRateKPIModel[]> {
    const kpiData: TrashRateKPIModel[] =
      await this.trashRateReportRepository.getTrashRateKPI(startDate, endDate);

    if (kpiData.length === 0) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `No KPI data found for the given date range ${startDate} to ${endDate}`,
      });
    }
    return kpiData;
  }
}
