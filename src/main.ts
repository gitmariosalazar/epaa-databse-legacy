import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { environments } from './settings/environments/environments';
import * as morgan from 'morgan';

async function bootstrap() {
  const logger: Logger = new Logger('Epaa-Database-Legacy-Main');

  const app = await NestFactory.create(AppModule);

  await app.listen(environments.NODE_ENV === 'production' ? 3009 : 4009);
  app.use(morgan('dev'));
  logger.log(
    `🚀🎉 The Epaa Database Legacy microservice is running: http://localhost:${environments.NODE_ENV === 'production' ? 3009 : 4009}✅`,
  );
  const microservice = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: `${environments.EPAA_LEGACY_READINGS_KAFKA_CLIENT_ID}-v3`,
        brokers: [environments.KAFKA_BROKER_URL],
      },
      producer: {
        maxInFlightRequests: 1,
        idempotent: false,
        allowAutoTopicCreation: true,
        maxRequestSize: 10485760, // 10MB
      },
      consumer: {
        groupId: `${environments.EPAA_LEGACY_READINGS_KAFKA_GROUP_ID}-v3`,
        allowAutoTopicCreation: true,
        maxBytesPerPartition: 52428800, // 50MB
        maxBytes: 52428800, // 50MB,
        sessionTimeout: 60000, // 60 segundos (o 90000 si inserts tardan >30s)
        heartbeatInterval: 20000, // ~1/3 del sessionTimeout (recomendado por kafkajs docs)
        rebalanceTimeout: 120000, // Opcional, pero ayuda en rebalances
        subscribe: {
          fromBeginning: true,
        },
      },
    },
  }); //

  await microservice.listen();
  logger.log(`Nest application successfully started`);
}
bootstrap();
