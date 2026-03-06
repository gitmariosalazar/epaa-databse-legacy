import { Injectable, Inject } from '@nestjs/common';
import { InterfaceTrashRateReportRepository } from '../../../domain/contracts/trash-rate-report.interface.repository';
import { CreditNoteRowModel } from '../../../domain/models/trash-rate-report.model';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../settings/environments/status-code';

@Injectable()
export class GetCreditNoteRowUseCase {
  constructor(
    @Inject('TrashRateReportRepository')
    private readonly trashRateReportRepository: InterfaceTrashRateReportRepository,
  ) {}

  async execute(
    startDate: string,
    limit: number,
    offset: number,
  ): Promise<CreditNoteRowModel[]> {
    const modelResult: CreditNoteRowModel[] =
      await this.trashRateReportRepository.getActiveCreditNotes(
        startDate,
        limit,
        offset,
      );

    if (modelResult.length === 0) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `No results found for the given start date ${startDate}`,
      });
    }

    return modelResult;
  }
}
