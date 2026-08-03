import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MigrationService } from '../../application/services/migration.service';

@Controller('migration/lecturas')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @MessagePattern('epaa-legacy.migration.migrate-lecturas')
  async migrate(@Payload() data: { months?: string[] }) {
    return this.migrationService.migrateLecturas(data?.months);
  }

  @MessagePattern('epaa-legacy.migration.compare-lecturas')
  async compare(@Payload() data: { months?: string[] }) {
    return this.migrationService.compareLecturas(data?.months);
  }
}
