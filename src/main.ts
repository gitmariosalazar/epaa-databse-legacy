import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { environments } from './settings/environments/environments';
import * as morgan from 'morgan';
//import { DatabaseServiceSQLServer2022 } from './shared/connections/database/sqlserver/sqlserver-2022.service';
import { DatabaseServiceSQLServer2000 } from './shared/connections/database/sqlserver/sqlserver-2000.service';

async function bootstrap() {
  const logger: Logger = new Logger('Epaa-Database-Legacy-Main');

  const app = await NestFactory.create(AppModule);

  await app.listen(environments.NODE_ENV === 'production' ? 3009 : 4009);
  app.use(morgan('dev'));


  const postgresqlService: DatabaseServiceSQLServer2000 = app.get(DatabaseServiceSQLServer2000);

  logger.log(await postgresqlService.connect())
  logger.log(
    `🚀🎉 The Epaa Database Legacy microservice is running: http://localhost:${environments.NODE_ENV === 'production' ? 3009 : 4009}✅`,
  );

  const microservice = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: environments.EPAA_LEGACY_READINGS_KAFKA_CLIENT_ID,
        brokers: [environments.KAFKA_BROKER_URL],
      },
      consumer: {
        groupId: environments.EPAA_LEGACY_READINGS_KAFKA_GROUP_ID,
        allowAutoTopicCreation: true,
      },
    },
  });

  await microservice.listen();
  logger.log(`🚀🎉 The Epaa Database Legacy - microservice is listening to KAFKA...✅`);
}
bootstrap();
