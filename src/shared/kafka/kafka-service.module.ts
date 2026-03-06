// src/work-orders/shared/kafka/kafka-service.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { environments } from '../../settings/environments/environments';

@Module({
  imports: [
    ClientsModule.register([
      // You only need ONE client as a real consumer (the rest can be producers)
      {
        name: environments.EPAA_LEGACY_READINGS_KAFKA_CLIENT, // this is the main one
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [environments.KAFKA_BROKER_URL],
            clientId: environments.EPAA_LEGACY_READINGS_KAFKA_CLIENT_ID,
          },
          consumer: {
            groupId: environments.EPAA_LEGACY_READINGS_KAFKA_GROUP_ID,
            allowAutoTopicCreation: true,
          },
        },
      },
      // Here you can add more Kafka clients if needed for other purposes
      /*
      {
        name: environments.WORK_HISTORY_KAFKA_CLIENT,
        transport: Transport.KAFKA,
        options: {
          client: { brokers: [environments.KAFKA_BROKER_URL] },
          producerOnlyMode: true, // only emits, does not consume
        },
      },
      */
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaServiceModule {}
