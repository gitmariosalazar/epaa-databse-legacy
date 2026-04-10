import { Module } from '@nestjs/common';
import { ReadingService } from '../../application/services/reading.service';
import { ReadingController } from '../controllers/reading.controller';
import { ReadingSQLServer2000Persistence } from '../repositories/sqlserver/persistence/sql-server-2000.reading.persistence';
import { KafkaServiceModule } from '../../../../shared/kafka/kafka-service.module';
import { DatabaseServiceSQLServer2000 } from '../../../../shared/connections/database/sqlserver/sqlserver-2000.service';

@Module({
  imports: [KafkaServiceModule],
  controllers: [ReadingController],
  providers: [
    // Providers here
    ReadingService,
    DatabaseServiceSQLServer2000,
    {
      provide: 'ReadingsRepository',
      useClass: ReadingSQLServer2000Persistence,
    },
  ],
  exports: [],
})
export class ReadingModuleUsingSQLServer2000 {}
