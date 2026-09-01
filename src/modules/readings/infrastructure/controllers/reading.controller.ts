import { Controller, Get, Post, Put } from '@nestjs/common';
import { ReadingService } from '../../application/services/reading.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateReadingLegacyRequest } from '../../domain/schemas/dto/request/create.reading.request';
import { FindCurrentReadingParams } from '../../domain/schemas/dto/request/find-current-reading.paramss';
import { UpdateReadingRequest } from '../../domain/schemas/dto/request/update.reading.request';
import { ReadingNotFoundException } from '../../domain/exceptions/reading-not-found.exception';

@Controller('readings')
export class ReadingController {
  constructor(private readonly readingService: ReadingService) {}

  @Post('create-reading-legacy')
  @MessagePattern('epaa-legacy.reading.create-reading-legacy')
  async createReading(@Payload() reading: CreateReadingLegacyRequest) {
    try {
      console.log(`Received createReading request: ${JSON.stringify(reading)}`);
      return await this.readingService.createReading(reading);
    } catch (error) {
      const err = error as Error;

      console.error(`Error in createReading: ${err.message}`, err);
      // Retornar un objeto de error en lugar de arrojar una excepción
      // evita que Kafka reintente el evento en un bucle infinito.
      return {
        statusCode: 500,
        message: err.message || 'Internal server error',
      };
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
  ) {
    try {
      /*
      console.log(
        `Received updateCurrentReading request: ${JSON.stringify(data)}`,
      );
      */
      return await this.readingService.updateCurrentReading(
        data.params,
        data.request,
      );
    } catch (error) {
      if (error instanceof ReadingNotFoundException) {
        console.warn(`Reading not found: ${error.message}`);
        return {
          statusCode: 404,
          message: error.message,
        };
      }
      const err = error as Error;
      console.error(`Error updating reading: ${err}`);
      return {
        statusCode: 500,
        message: err.message || 'Internal server error',
      };
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
  ) {
    try {
      /*
      console.log(
        `Received updateCurrentReading request: ${JSON.stringify(data)}`,
      );
      */
      return await this.readingService.updateSpecialCurrentReading(
        data.params,
        data.request,
      );
    } catch (error) {
      if (error instanceof ReadingNotFoundException) {
        console.warn(`Reading not found: ${error.message}`);
        return {
          statusCode: 404,
          message: error.message,
        };
      }
      const err = error as Error;
      console.error(`Error updating reading: ${err}`);
      return {
        statusCode: 500,
        message: err.message || 'Internal server error',
      };
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
}
