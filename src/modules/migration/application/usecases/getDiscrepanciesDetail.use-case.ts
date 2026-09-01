import { Inject, Injectable } from '@nestjs/common';
import {
  ConsultarDetalleAuditoriaParams,
  DetalleAuditoriaResponse,
  LECTURAS_RECONCILIATION_REPOSITORY,
  LecturasReconciliationRepository,
} from '../../domain/contracts/lecturas-reconciliation.repository';

@Injectable()
export class GetDiscrepanciesDetailUseCase {
  constructor(
    @Inject(LECTURAS_RECONCILIATION_REPOSITORY)
    private readonly reconciliationRepository: LecturasReconciliationRepository,
  ) {}

  async execute(
    params: ConsultarDetalleAuditoriaParams,
  ): Promise<DetalleAuditoriaResponse> {
    return this.reconciliationRepository.getDiscrepanciesDetail(params);
  }
}
