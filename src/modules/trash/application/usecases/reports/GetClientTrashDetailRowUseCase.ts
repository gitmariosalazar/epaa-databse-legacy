import { Injectable, Inject } from '@nestjs/common';
import { InterfaceTrashRateReportRepository } from '../../../domain/contracts/trash-rate-report.interface.repository';
import { ClientTrashDetailRowModel } from '../../../domain/models/trash-rate-report.model';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../settings/environments/status-code';

@Injectable()
export class GetClientTrashDetailRowUseCase {
  constructor(
    @Inject('TrashRateReportRepository')
    private readonly trashRateReportRepository: InterfaceTrashRateReportRepository,
  ) {}

  async execute(searchParams: string): Promise<ClientTrashDetailRowModel[]> {
    const modelResult: ClientTrashDetailRowModel[] =
      await this.trashRateReportRepository.getClientDetailSearch(searchParams);

    if (modelResult.length === 0) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `No results found for the given search params ${searchParams}`,
      });
    }

    return modelResult;
  }
}
