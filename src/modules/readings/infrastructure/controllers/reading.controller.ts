import { Controller, Get, Post, Put } from '@nestjs/common';
import { ReadingService } from '../../application/services/reading.service';
import {
  Ctx,
  KafkaContext,
  MessagePattern,
  Payload,
  KafkaRetriableException,
  RpcException,
} from '@nestjs/microservices';
import { CreateReadingLegacyRequest } from '../../domain/schemas/dto/request/create.reading.request';
import { FindCurrentReadingParams } from '../../domain/schemas/dto/request/find-current-reading.paramss';
import { UpdateReadingRequest } from '../../domain/schemas/dto/request/update.reading.request';
import { ReadingNotFoundException } from '../../domain/exceptions/reading-not-found.exception';

@Controller('readings')
export class ReadingController {
  constructor(private readonly readingService: ReadingService) {}

  @Post('create-reading-legacy')
  @MessagePattern('epaa-legacy.reading.create-reading-legacy')
  async createReading(
    @Payload() reading: CreateReadingLegacyRequest,
    @Ctx() context: KafkaContext,
  ) {
    try {
      console.log(`Received createReading request: ${JSON.stringify(reading)}`);
      const result = await this.readingService.createReading(reading);
      const consumer = context.getConsumer();
      const message = context.getMessage();
      const topic = context.getTopic();
      await consumer.commitOffsets([
        {
          topic,
          partition: context.getPartition(),
          offset: (Number(message.offset) + 1).toString(),
        },
      ]);
      return result;
    } catch (error) {
      const err = error as Error;

      console.error(`Error in createReading: ${err.message}`, err);
      
      // Lanzamos KafkaRetriableException para que Kafka NO haga commit
      // y reintente este mensaje hasta que la DB responda correctamente.
      throw new KafkaRetriableException(err.message || 'Internal server error');
    }
  }

  @Get('find-current-reading')
  @MessagePattern('epaa-legacy.reading.find-current-reading')
  findCurrentReading(@Payload() params: FindCurrentReadingParams) {
    console.log(
      `Received findCurrentReading request: ${JSON.stringify(params)}`,
    );
    return this.readingService.findCurrentReading(params);
  }

  @Put('update-current-reading')
  @MessagePattern('epaa-legacy.reading.update-current-reading')
  async updateCurrentReading(
    @Payload()
    data: {
      params: FindCurrentReadingParams;
      request: UpdateReadingRequest;
    },
    @Ctx() context: KafkaContext,
  ) {
    try {
      /*
      console.log(
        `Received updateCurrentReading request: ${JSON.stringify(data)}`,
      );
      */
      const result = await this.readingService.updateCurrentReading(
        data.params,
        data.request,
      );
      const consumer = context.getConsumer();
      const message = context.getMessage();
      const topic = context.getTopic();
      await consumer.commitOffsets([
        {
          topic,
          partition: context.getPartition(),
          offset: (Number(message.offset) + 1).toString(),
        },
      ]);
      return result;
    } catch (error) {
      if (error instanceof ReadingNotFoundException) {
        console.warn(`Reading not found: ${error.message}`);
        // Es un error de negocio (404), NO queremos reintentarlo. 
        // Hacemos commit para sacarlo de Kafka y avisamos al Gateway.
        const consumer = context.getConsumer();
        const message = context.getMessage();
        const topic = context.getTopic();
        await consumer.commitOffsets([
          { topic, partition: context.getPartition(), offset: (Number(message.offset) + 1).toString() }
        ]);
        
        throw new RpcException({
          statusCode: 404,
          message: error.message,
        });
      }
      const err = error as Error;
      console.error(`Error updating reading: ${err}`);
      // Error de servidor/DB (500). Pedimos reintento a Kafka.
      throw new KafkaRetriableException(err.message || 'Internal server error');
    }
  }

  @Put('update-special-current-reading')
  @MessagePattern('epaa-legacy.reading.update-special-current-reading')
  async updateSpecialCurrentReading(
    @Payload()
    data: {
      params: FindCurrentReadingParams;
      request: UpdateReadingRequest;
    },
    @Ctx() context: KafkaContext,
  ) {
    try {
      /*
      console.log(
        `Received updateSpecialCurrentReading request: ${JSON.stringify(data)}`,
      );
      */
      const result = await this.readingService.updateSpecialCurrentReading(
        data.params,
        data.request,
      );
      const consumer = context.getConsumer();
      const message = context.getMessage();
      const topic = context.getTopic();
      await consumer.commitOffsets([
        {
          topic,
          partition: context.getPartition(),
          offset: (Number(message.offset) + 1).toString(),
        },
      ]);
      return result;
    } catch (error) {
      if (error instanceof ReadingNotFoundException) {
        console.warn(`Reading not found: ${error.message}`);
        // Es un error de negocio (404), NO queremos reintentarlo. 
        // Hacemos commit para sacarlo de Kafka y avisamos al Gateway.
        const consumer = context.getConsumer();
        const message = context.getMessage();
        const topic = context.getTopic();
        await consumer.commitOffsets([
          { topic, partition: context.getPartition(), offset: (Number(message.offset) + 1).toString() }
        ]);
        
        throw new RpcException({
          statusCode: 404,
          message: error.message,
        });
      }
      const err = error as Error;
      console.error(`Error updating reading: ${err}`);
      // Error de servidor/DB (500). Pedimos reintento a Kafka.
      throw new KafkaRetriableException(err.message || 'Internal server error');
    }
  }

  @Get('calculate-reading-value')
  @MessagePattern('epaa-legacy.reading.calculate-reading-value')
  calculateReadingValue(
    @Payload()
    params: {
      cadastralKey: string;
      consumptionM3: number;
    },
  ) {
    console.log(
      `Received calculateReadingValue request: ${JSON.stringify(params)}`,
    );
    return this.readingService.calculateReadingValue(
      params.cadastralKey,
      params.consumptionM3,
    );
  }

  @Get('get-dashboard-kpis-by-period')
  @MessagePattern('epaa-legacy.reading.get-dashboard-kpis-by-period')
  async getDashboardKpisByPeriod(
    @Payload()
    params: {
      year: number;
      month: string;
    },
  ) {
    console.log(
      `Received getDashboardKpisByPeriod request: ${JSON.stringify(params)}`,
    );
    return await this.readingService.getDashboardKpisByPeriod(
      params.year,
      params.month,
    );
  }
}
