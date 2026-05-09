import { Module } from '@nestjs/common';
import { AccountingService } from '../../../application/services/accounting.service';
import { AccountingController } from '../../controllers/accounting.controller';
import { SQLServerAccountingPersistence } from '../../repositories/sqlserver/persistence/sql-server.accounting.persistence';
import { SQLServerEntryDataPersistence } from '../../repositories/sqlserver/persistence/sql-server.accounting.entry-data.persistence';
import { SqlServerGeneralCollectionPersistence } from '../../repositories/sqlserver/persistence/sql-server.general-collection.persistence';
import { SqlServerAgreementsPersistence } from '../../repositories/sqlserver/persistence/sql-server.agreements.persistence';
import { ExternalPayrollPersistence } from '../../repositories/http/persistence/external-payroll.persistence';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule],
  controllers: [AccountingController],
  providers: [
    AccountingService,
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
  ],
  exports: [AccountingService],
})
export class AccountingModuleUsingSQLServer2022 {}
