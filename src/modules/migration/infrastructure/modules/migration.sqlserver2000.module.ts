import { Module } from '@nestjs/common';
import { MigrationService } from '../../application/services/migration.service';
import { MigrateLecturasUseCase } from '../../application/usecases/migrate-lecturas.usecase';
import { CompareLecturasUseCase } from '../../application/usecases/compare-lecturas.usecase';
import { ReconciliationService } from '../../application/services/reconciliation.service';
import { GetReconciliationSummaryUseCase } from '../../application/usecases/get-reconciliation-summary.usecase';
import { GetReconciliationDuplicatesUseCase } from '../../application/usecases/get-reconciliation-duplicates.usecase';
import { GetReconciliationMismatchesUseCase } from '../../application/usecases/get-reconciliation-mismatches.usecase';
import { LECTURAS_SOURCE_REPOSITORY } from '../../domain/contracts/lecturas-source.repository';
import { LECTURAS_TARGET_REPOSITORY } from '../../domain/contracts/lecturas-target.repository';
import { LECTURAS_RECONCILIATION_REPOSITORY } from '../../domain/contracts/lecturas-reconciliation.repository';
import { MigrationController } from '../controller/migration.controller';
import { ReconciliationController } from '../controller/reconciliation.controller';
import { PostgresLecturasRepository } from '../repositories/postgres/postgres-lecturas.repository';
import { SqlServer2000LecturasRepository } from '../repositories/sqlserver/sqlserver-2000-lecturas.repository';
import { SqlServer2000ReconciliationRepository } from '../repositories/sqlserver/sqlserver-2000-reconciliation.repository';
import { DatabasePersistenceModule } from '../../../../shared/connections/database/database-persistence.module';

@Module({
  imports: [DatabasePersistenceModule],
  controllers: [MigrationController, ReconciliationController],
  providers: [
    MigrationService,
    MigrateLecturasUseCase,
    CompareLecturasUseCase,
    ReconciliationService,
    GetReconciliationSummaryUseCase,
    GetReconciliationDuplicatesUseCase,
    GetReconciliationMismatchesUseCase,
    {
      provide: LECTURAS_SOURCE_REPOSITORY,
      useClass: PostgresLecturasRepository,
    },
    {
      provide: LECTURAS_TARGET_REPOSITORY,
      useClass: SqlServer2000LecturasRepository,
    },
    {
      provide: LECTURAS_RECONCILIATION_REPOSITORY,
      useClass: SqlServer2000ReconciliationRepository,
    },
  ],
  exports: [MigrationService, ReconciliationService],
})
export class MigrationSQLServer2000Module {}
