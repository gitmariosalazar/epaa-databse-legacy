import { Module } from '@nestjs/common';
import { AccountingService } from '../../../application/services/accounting.service';
import { AccountingController } from '../../controllers/accounting.controller';
import { SQLServerAccountingPersistence } from '../../repositories/sqlserver/persistence/sql-server.accounting.persistence';
import { SQLServerEntryDataPersistence } from '../../repositories/sqlserver/persistence/sql-server.accounting.entry-data.persistence';
import { ExternalPayrollPersistence } from '../../repositories/http/persistence/external-payroll.persistence';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabaseServiceSQLServer2022 } from '../../../../../shared/connections/database/sqlserver/sqlserver-2022.service';
import { SqlServerGeneralCollectionPersistence } from '../../repositories/sqlserver/persistence/sql-server.general-collection.persistence';

@Module({
  imports: [KafkaServiceModule],
  controllers: [AccountingController],
  providers: [
    AccountingService,
    DatabaseServiceSQLServer2022,
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
  ],
  exports: [AccountingService],
})
export class AccountingModuleUsingSQLServer2022 {}
