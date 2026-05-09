import { Module } from '@nestjs/common';
import { ReadingService } from '../../application/services/reading.service';
import { ReadingController } from '../controllers/reading.controller';
import { ReadingSQLServer2022Persistence } from '../repositories/sqlserver/persistence/sql-server.reading.persistence';
import { DatabasePersistenceModule } from '../../../../shared/connections/database/database-persistence.module';
import { KafkaServiceModule } from '../../../../shared/kafka/kafka-service.module';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule],
  controllers: [ReadingController],
  providers: [
    ReadingService,
    {
      provide: 'ReadingsRepository',
      useClass: ReadingSQLServer2022Persistence,
    },
  ],
  exports: [ReadingService],
})
export class ReadingSQLServer2022Module {}
