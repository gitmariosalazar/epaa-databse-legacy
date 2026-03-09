import { Inject, Injectable } from '@nestjs/common';
import { InterfaceTrashRateReportRepository } from '../../../domain/contracts/trash-rate-report.interface.repository';
import { DailyCollectorDetailModel } from '../../../domain/models/trash-rate-report.model';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../settings/environments/status-code';

@Injectable()
export class GetDailyCollectorDetailUseCase {
  constructor(
    @Inject('TrashRateReportRepository')
    private readonly trashRateReportRepository: InterfaceTrashRateReportRepository,
  ) {}

  async execute(
    startDate: string,
    endDate: string,
  ): Promise<DailyCollectorDetailModel[]> {
    const detailData: DailyCollectorDetailModel[] =
      await this.trashRateReportRepository.getDailyCollectorDetail(
        startDate,
        endDate,
      );

    if (detailData.length === 0) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `No daily collector detail data found for the given date range ${startDate} to ${endDate}`,
      });
    }

    return detailData;
  }
}
