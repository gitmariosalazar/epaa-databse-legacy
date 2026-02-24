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
  createReading(@Payload() reading: CreateReadingLegacyRequest) {
    console.log(`Received createReading request: ${JSON.stringify(reading)}`);
    return this.readingService.createReading(reading);
  }

  @Get('find-current-reading')
  @MessagePattern('epaa-legacy.reading.find-current-reading')
  findCurrentReading(
    @Payload()
    params: {
      sector: number;
      account: number;
      incomeCode: number;
      year: number;
      month: string;
      previousReading: number;
    },
  ) {
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
      console.log(
        `Received updateCurrentReading request: ${JSON.stringify(data)}`,
      );
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
      console.error(`Error updating reading: ${error.message}`);
      return {
        statusCode: 500,
        message: error.message || 'Internal server error',
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

  @Get('find-pending-reading-by-cadastral-key')
  @MessagePattern('epaa-legacy.reading.find-pending-reading-by-cadastral-key')
  findPendingReadingByCadastralKey(
    @Payload()
    params: {
      cadastralKey: string;
    },
  ) {
    console.log(
      `Received findPendingReadingByCadastralKey request: ${JSON.stringify(params)}`,
    );
    return this.readingService.findPendingReadingsByCadastralKey(
      params.cadastralKey,
    );
  }

  @Get('find-pending-reading-by-card-id')
  @MessagePattern('epaa-legacy.reading.find-pending-reading-by-card-id')
  findPendingReadingByCardId(
    @Payload()
    params: {
      cardId: string;
    },
  ) {
    console.log(
      `Received findPendingReadingByCardId request: ${JSON.stringify(params)}`,
    );
    return this.readingService.findPendingReadingsByCardId(params.cardId);
  }

  @Get('find-pending-reading-by-cadastral-key-or-card-id')
  @MessagePattern('epaa-legacy.reading.find-pending-reading-by-cadastral-key-or-card-id')
  findPendingReadingByCadastralKeyOrCardId(
    @Payload()
    params: {
      searchValue: string;
    },
  ) {
    console.log(
      `Received findPendingReadingByCadastralKeyOrCardId request: ${JSON.stringify(params)}`,
    );
    return this.readingService.findPendingReadingsByCadastralKeyOrCardId(
      params.searchValue,
    );
  }
}
