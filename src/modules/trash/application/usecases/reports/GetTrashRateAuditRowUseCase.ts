import { Injectable, Inject } from '@nestjs/common';
import { InterfaceTrashRateReportRepository } from '../../../domain/contracts/trash-rate-report.interface.repository';
import { TrashRateAuditRowModel } from '../../../domain/models/trash-rate-report.model';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../settings/environments/status-code';

@Injectable()
export class GetTrashRateAuditRowUseCase {
  constructor(
    @Inject('TrashRateReportRepository')
    private readonly trashRateReportRepository: InterfaceTrashRateReportRepository,
  ) {}

  async execute(
    startDate: string,
    endDate: string,
    limit: number,
    offset: number,
  ): Promise<TrashRateAuditRowModel[]> {
    const modelResult: TrashRateAuditRowModel[] =
      await this.trashRateReportRepository.getTrashRateAuditReport(
        startDate,
        endDate,
        limit,
        offset,
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
