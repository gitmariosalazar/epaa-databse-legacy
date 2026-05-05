import { Injectable, Inject } from '@nestjs/common';
import { InterfaceTrashRateReportRepository } from '../../../domain/contracts/trash-rate-report.interface.repository';
import { TrashRateAuditRowModel } from '../../../domain/models/trash-rate-report.model';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../settings/environments/status-code';
import { TrashRateAuditReportParams } from '../../../domain/schemas/params/trash-rate-audit-report.params';

@Injectable()
export class GetTrashRateAuditRowUseCase {
  constructor(
    @Inject('TrashRateReportRepository')
    private readonly trashRateReportRepository: InterfaceTrashRateReportRepository,
  ) {}

  async execute(
    params: TrashRateAuditReportParams,
  ): Promise<TrashRateAuditRowModel[]> {
    const modelResult: TrashRateAuditRowModel[] =
      await this.trashRateReportRepository.getTrashRateAuditReport(params);

    if (modelResult.length === 0) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `No results found for the given start date ${params.startDate} and end date ${params.endDate} with diagnostic filter ${params.diagnosticFilter} and audit type ${params.auditType}.`,
      });
    }
    return modelResult;
  }
}
