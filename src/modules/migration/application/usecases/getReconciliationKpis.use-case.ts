import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  LECTURAS_RECONCILIATION_REPOSITORY,
  LecturasReconciliationRepository,
  ReconciliationPeriod,
  ResumenAuditoriaResponse,
} from '../../domain/contracts/lecturas-reconciliation.repository';

@Injectable()
export class GetReconciliationKpisUseCase {
  private readonly logger = new Logger(GetReconciliationKpisUseCase.name);

  constructor(
    @Inject(LECTURAS_RECONCILIATION_REPOSITORY)
    private readonly reconciliationRepository: LecturasReconciliationRepository,
  ) {}

  async execute(
    params: ReconciliationPeriod,
  ): Promise<ResumenAuditoriaResponse> {
    return this.reconciliationRepository.getReconciliationKpis(params);
  }
}
