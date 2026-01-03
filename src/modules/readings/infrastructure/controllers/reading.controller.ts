import { Controller, Get, Post, Put } from '@nestjs/common';
import { ReadingService } from '../../application/services/reading.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateReadingLegacyRequest } from '../../domain/schemas/dto/request/create.reading.request';
import { FindCurrentReadingParams } from '../../domain/schemas/dto/request/find-current-reading.paramss';
import { UpdateReadingRequest } from '../../domain/schemas/dto/request/update.reading.request';

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
  updateCurrentReading(
    @Payload()
    data: {
      params: FindCurrentReadingParams;
      request: UpdateReadingRequest;
    },
  ) {
    console.log(
      `Received updateCurrentReading request: ${JSON.stringify(data)}`,
    );
    return this.readingService.updateCurrentReading(data.params, data.request);
  }
}
