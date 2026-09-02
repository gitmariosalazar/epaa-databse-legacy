import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  LECTURAS_RECONCILIATION_REPOSITORY,
  LecturasReconciliationRepository,
  ReconciliationPeriod,
} from '../../domain/contracts/lecturas-reconciliation.repository';
import { ReconciliationSummaryDto } from '../../domain/schemas/dto/reconciliation-result.dto';
import { ReconciliationFailedException } from '../../domain/exceptions/migration.exceptions';

@Injectable()
export class GetReconciliationSummaryUseCase {
  private readonly logger = new Logger(GetReconciliationSummaryUseCase.name);

  constructor(
    @Inject(LECTURAS_RECONCILIATION_REPOSITORY)
    private readonly reconciliationRepository: LecturasReconciliationRepository,
  ) {}

  async execute(
    period: ReconciliationPeriod,
  ): Promise<ReconciliationSummaryDto> {
    try {
      const summary = await this.reconciliationRepository.getSummary(period);
      return new ReconciliationSummaryDto(
        summary.totalPostgres,
        summary.totalApLecturas,
        summary.matched,
        summary.mismatched,
        summary.missingInApLecturas,
        summary.missingInPostgres,
        summary.sumaLecturasActualPostgres,
        summary.sumaLecturasActualApLecturas,
        summary.diferenciaAbsolutaLecturas,
      );
    } catch (error) {
      this.logger.error(
        'Error obteniendo el resumen de reconciliación',
        error as Error,
      );
      throw new ReconciliationFailedException((error as Error).message);
    }
  }
}
