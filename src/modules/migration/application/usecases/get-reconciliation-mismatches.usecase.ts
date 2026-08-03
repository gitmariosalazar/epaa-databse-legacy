import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  LECTURAS_RECONCILIATION_REPOSITORY,
  LecturasReconciliationRepository,
  ReconciliationPeriod,
} from '../../domain/contracts/lecturas-reconciliation.repository';
import { ReconciliationMismatchDto } from '../../domain/schemas/dto/reconciliation-result.dto';
import { ReconciliationFailedException } from '../../domain/exceptions/migration.exceptions';

@Injectable()
export class GetReconciliationMismatchesUseCase {
  private readonly logger = new Logger(GetReconciliationMismatchesUseCase.name);

  constructor(
    @Inject(LECTURAS_RECONCILIATION_REPOSITORY)
    private readonly reconciliationRepository: LecturasReconciliationRepository,
  ) {}

  async execute(
    period: ReconciliationPeriod,
  ): Promise<ReconciliationMismatchDto[]> {
    try {
      const mismatches =
        await this.reconciliationRepository.getMismatches(period);
      return mismatches.map(
        (mismatch) =>
          new ReconciliationMismatchDto(
            mismatch.acometidaId,
            mismatch.mesLectura,
            mismatch.claveCatastral,
            mismatch.postgresLecturaAnterior,
            mismatch.legacyLecturaAnterior,
            mismatch.postgresLecturaActual,
            mismatch.legacyLecturaActual,
            mismatch.status,
          ),
      );
    } catch (error) {
      this.logger.error(
        'Error obteniendo las diferencias de reconciliación',
        error as Error,
      );
      throw new ReconciliationFailedException((error as Error).message);
    }
  }
}
