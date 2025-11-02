import { Module } from "@nestjs/common";
import { ReadingService } from "../../application/services/reading.service";
import { ReadingController } from "../controllers/reading.controller";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ReadingSQLServer2000Persistence } from "../repositories/sqlserver/persistence/sql-server-2000.reading.persistence";
import { environments } from "../../../../settings/environments/environments";
import { DatabaseServiceSQLServer2000 } from "../../../../shared/connections/database/sqlserver/sqlserver-2000.service";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: environments.EPAA_LEGACY_READINGS_KAFKA_CLIENT,
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [environments.KAFKA_BROKER_URL],
            clientId: environments.EPAA_LEGACY_READINGS_KAFKA_CLIENT_ID,
          },
          consumer: {
            groupId: environments.EPAA_LEGACY_READINGS_KAFKA_GROUP_ID,
          },
        }
      }
    ]),
  ],
  controllers: [ReadingController],
  providers: [
    // Providers here
    ReadingService,
    DatabaseServiceSQLServer2000,
    {
      provide: 'ReadingsRepository',
      useClass: ReadingSQLServer2000Persistence
    }
  ],
  exports: []
})
export class ReadingModuleUsingSQLServer2000 { }