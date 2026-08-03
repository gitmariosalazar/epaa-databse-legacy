import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReconciliationService } from '../../application/services/reconciliation.service';

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
}
