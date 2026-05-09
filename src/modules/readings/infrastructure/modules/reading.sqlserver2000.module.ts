import { Module } from '@nestjs/common';
import { ReadingService } from '../../application/services/reading.service';
import { ReadingController } from '../controllers/reading.controller';
import { ReadingSQLServer2000Persistence } from '../repositories/sqlserver/persistence/sql-server-2000.reading.persistence';
import { DatabasePersistenceModule } from '../../../../shared/connections/database/database-persistence.module';
import { KafkaServiceModule } from '../../../../shared/kafka/kafka-service.module';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule],
  controllers: [ReadingController],
  providers: [
    ReadingService,
    {
      provide: 'ReadingsRepository',
      useClass: ReadingSQLServer2000Persistence,
    },
  ],
  exports: [ReadingService],
})
export class ReadingSQLServer2000Module {}
