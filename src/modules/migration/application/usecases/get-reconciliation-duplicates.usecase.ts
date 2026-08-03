import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  LECTURAS_RECONCILIATION_REPOSITORY,
  LecturasReconciliationRepository,
  ReconciliationPeriod,
} from '../../domain/contracts/lecturas-reconciliation.repository';
import { ReconciliationDuplicateDto } from '../../domain/schemas/dto/reconciliation-result.dto';
import { ReconciliationFailedException } from '../../domain/exceptions/migration.exceptions';

@Injectable()
export class GetReconciliationDuplicatesUseCase {
  private readonly logger = new Logger(GetReconciliationDuplicatesUseCase.name);

  constructor(
    @Inject(LECTURAS_RECONCILIATION_REPOSITORY)
    private readonly reconciliationRepository: LecturasReconciliationRepository,
  ) {}

  async execute(
    period: ReconciliationPeriod,
  ): Promise<ReconciliationDuplicateDto[]> {
    try {
      const duplicates =
        await this.reconciliationRepository.getDuplicates(period);
      return duplicates.map(
        (duplicate) =>
          new ReconciliationDuplicateDto(
            duplicate.source,
            duplicate.identifier,
            duplicate.anio,
            duplicate.mes,
            duplicate.occurrences,
          ),
      );
    } catch (error) {
      this.logger.error(
        'Error obteniendo los duplicados de reconciliación',
        error as Error,
      );
      throw new ReconciliationFailedException((error as Error).message);
    }
  }
}
