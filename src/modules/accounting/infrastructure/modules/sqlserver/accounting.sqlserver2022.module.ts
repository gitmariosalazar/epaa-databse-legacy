import { Module } from '@nestjs/common';
import { AccountingService } from '../../../application/services/accounting.service';
import { UpdateDailyInterestsService } from '../../../application/services/update-daily-interests.service';
import { AccountingController } from '../../controllers/accounting.controller';
import { SQLServerAccountingPersistence } from '../../repositories/sqlserver/persistence/sql-server.accounting.persistence';
import { SQLServerEntryDataPersistence } from '../../repositories/sqlserver/persistence/sql-server.accounting.entry-data.persistence';
import { SqlServerGeneralCollectionPersistence } from '../../repositories/sqlserver/persistence/sql-server.general-collection.persistence';
import { SqlServerAgreementsPersistence } from '../../repositories/sqlserver/persistence/sql-server.agreements.persistence';
import { SqlServerInterestPersistence } from '../../repositories/sqlserver/persistence/sql-server.interest.persistence';
import { ExternalPayrollPersistence } from '../../repositories/http/persistence/external-payroll.persistence';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';

@Module({
  imports: [DatabasePersistenceModule],
  controllers: [AccountingController],
  providers: [
    AccountingService,
    UpdateDailyInterestsService,
    {
      provide: 'AccountingRepository',
      useClass: SQLServerAccountingPersistence,
    },
    {
      provide: 'ExternalPayrollRepository',
      useClass: ExternalPayrollPersistence,
    },
    {
      provide: 'EntryDataRepository',
      useClass: SQLServerEntryDataPersistence,
    },
    {
      provide: 'GeneralCollectionRepository',
      useClass: SqlServerGeneralCollectionPersistence,
    },
    {
      provide: 'AgreementsRepository',
      useClass: SqlServerAgreementsPersistence,
    },
    {
      provide: 'IInterestRepository',
      useClass: SqlServerInterestPersistence,
    },
  ],
  exports: [AccountingService, UpdateDailyInterestsService],
})
export class AccountingModuleUsingSQLServer2022 {}
