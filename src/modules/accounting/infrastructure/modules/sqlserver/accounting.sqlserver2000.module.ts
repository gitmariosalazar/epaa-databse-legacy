import { Module } from '@nestjs/common';
import { AccountingService } from '../../../application/services/accounting.service';
import { AccountingController } from '../../controllers/accounting.controller';
import { SQLServer2000AccountingPersistence } from '../../repositories/sqlserver/persistence/sql-server-2000.accounting.persistence';
import { SQLServer2000EntryDataPersistence } from '../../repositories/sqlserver/persistence/sql-server-2000.accounting.entry-data.persistence';
import { SqlServer2000GeneralCollectionPersistence } from '../../repositories/sqlserver/persistence/sql-server-2000.general-collection.persistence';
import { SqlServer2000AgreementsPersistence } from '../../repositories/sqlserver/persistence/sql-server-2000.agreements.persistence';
import { ExternalPayrollPersistence } from '../../repositories/http/persistence/external-payroll.persistence';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';

@Module({
  imports: [DatabasePersistenceModule],
  controllers: [AccountingController],
  providers: [
    AccountingService,
    {
      provide: 'AccountingRepository',
      useClass: SQLServer2000AccountingPersistence,
    },
    {
      provide: 'ExternalPayrollRepository',
      useClass: ExternalPayrollPersistence,
    },
    {
      provide: 'EntryDataRepository',
      useClass: SQLServer2000EntryDataPersistence,
    },
    {
      provide: 'GeneralCollectionRepository',
      useClass: SqlServer2000GeneralCollectionPersistence,
    },
    {
      provide: 'AgreementsRepository',
      useClass: SqlServer2000AgreementsPersistence,
    },
  ],
  exports: [AccountingService],
})
export class AccountingModuleUsingSQLServer2000 {}
