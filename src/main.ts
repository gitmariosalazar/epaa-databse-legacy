import { CustomServerKafka } from './shared/kafka/custom-server-kafka';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { environments } from './settings/environments/environments';
import * as morgan from 'morgan';
import { DatabaseAbstract } from './shared/connections/database/abstract/abstract.database';

async function bootstrap() {
  const logger: Logger = new Logger('Epaa-Database-Legacy-Main');

  const app = await NestFactory.create(AppModule);

  app.use(morgan('dev'));
  await app.listen(environments.NODE_ENV === 'production' ? 3009 : 4009);

  const dbService = app.get(DatabaseAbstract);
  logger.log(await dbService.connect());
  logger.log(
    `🚀🎉 The Epaa Database Legacy microservice is running: http://localhost:${environments.NODE_ENV === 'production' ? 3009 : 4009}✅`,
  );
  const microservice = await NestFactory.createMicroservice(AppModule, {
    strategy: new CustomServerKafka(
      {
        client: {
          clientId: environments.EPAA_LEGACY_READINGS_KAFKA_CLIENT_ID,
          brokers: [environments.KAFKA_BROKER_URL],
          retry: { retries: 25, initialRetryTime: 1000 },
        },
        consumer: {
          groupId: environments.EPAA_LEGACY_READINGS_KAFKA_GROUP_ID,
          allowAutoTopicCreation: true,
          // More tolerant settings for heavy handlers (SQL reports) to avoid
          // transient coordinator membership loss during rebalances.
          sessionTimeout: 300000, // 5 minutes
          heartbeatInterval: 10000,
          rebalanceTimeout: 300000,
          maxWaitTimeInMs: 5000,
        },
      },
      environments.KAFKA_TOPIC,
    ),
  });

  await microservice.listen();
  logger.log(`Nest application successfully started`);
}
bootstrap();
