import { Module } from "@nestjs/common";
import { ReadingService } from "../../application/services/reading.service";
import { DatabaseServiceSQLServer2022 } from "src/shared/connections/database/sqlserver/sqlserver-2022.service";
import { ReadingController } from "../controllers/reading.controller";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { environments } from "src/settings/environments/environments";
import { ReadingSQLServer2022Persistence } from "../repositories/sqlserver/persistence/sql-server.reading.persistence";

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
    DatabaseServiceSQLServer2022,
    {
      provide: 'ReadingsRepository',
      useClass: ReadingSQLServer2022Persistence
    }
  ],
  exports: []
})
export class ReadingModuleUsingSQLServer2022 { }