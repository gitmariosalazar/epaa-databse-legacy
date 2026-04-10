import { Module } from '@nestjs/common';
import { ReadingService } from '../../application/services/reading.service';
import { ReadingController } from '../controllers/reading.controller';
import { ReadingSQLServer2022Persistence } from '../repositories/sqlserver/persistence/sql-server.reading.persistence';
import { DatabaseServiceSQLServer2022 } from '../../../../shared/connections/database/sqlserver/sqlserver-2022.service';
import { KafkaServiceModule } from '../../../../shared/kafka/kafka-service.module';

@Module({
  imports: [KafkaServiceModule],
  controllers: [ReadingController],
  providers: [
    // Providers here
    ReadingService,
    DatabaseServiceSQLServer2022,
    {
      provide: 'ReadingsRepository',
      useClass: ReadingSQLServer2022Persistence,
    },
  ],
  exports: [],
})
export class ReadingModuleUsingSQLServer2022 {}
