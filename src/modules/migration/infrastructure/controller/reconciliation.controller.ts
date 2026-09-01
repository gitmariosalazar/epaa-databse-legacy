import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReconciliationService } from '../../application/services/reconciliation.service';
import { AuditoriaFiltroType } from '../../domain/contracts/lecturas-reconciliation.repository';

@Controller('migration/lecturas/reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @MessagePattern('epaa-legacy.migration.reconciliation.summary')
  async summary(@Payload() data: { mesLectura: string }) {
    return this.reconciliationService.getSummary(data?.mesLectura);
  }

  @MessagePattern('epaa-legacy.migration.reconciliation.duplicates')
  async duplicates(@Payload() data: { mesLectura: string }) {
    return this.reconciliationService.getDuplicates(data?.mesLectura);
  }

  @MessagePattern('epaa-legacy.migration.reconciliation.mismatches')
  async mismatches(@Payload() data: { mesLectura: string }) {
    return this.reconciliationService.getMismatches(data?.mesLectura);
  }

  @MessagePattern('epaa-legacy.migration.reconciliation.kpis')
  async kpis(@Payload() data: { mesLectura: string }) {
    return this.reconciliationService.getKpis(data?.mesLectura);
  }

  @MessagePattern('epaa-legacy.migration.reconciliation.discrepancies.detail')
  async discrepanciesDetail(@Payload() data: { mesLectura: string; tipo_filtro: AuditoriaFiltroType }) {
    return this.reconciliationService.getDiscrepanciesDetail(data?.mesLectura, data?.tipo_filtro);
  }
}
