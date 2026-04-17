import { Module } from '@nestjs/common';
import { AccountingService } from '../../../application/services/accounting.service';
import { AccountingController } from '../../controllers/accounting.controller';
import { SQLServer2000AccountingPersistence } from '../../repositories/sqlserver/persistence/sql-server-2000.accounting.persistence';
import { SQLServer2000EntryDataPersistence } from '../../repositories/sqlserver/persistence/sql-server-2000.accounting.entry-data.persistence';
import { ExternalPayrollPersistence } from '../../repositories/http/persistence/external-payroll.persistence';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabaseServiceSQLServer2000 } from '../../../../../shared/connections/database/sqlserver/sqlserver-2000.service';
import { SqlServer2000GeneralCollectionPersistence } from '../../repositories/sqlserver/persistence/sql-server-2000.general-collection.persistence';
import { SqlServer2000AgreementsPersistence } from '../../repositories/sqlserver/persistence/sql-server-2000.agreements.persistence';

@Module({
  imports: [KafkaServiceModule],
  controllers: [AccountingController],
  providers: [
    AccountingService,
    DatabaseServiceSQLServer2000,
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
