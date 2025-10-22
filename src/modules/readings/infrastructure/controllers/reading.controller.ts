import { Controller, Post } from "@nestjs/common";
import { ReadingService } from "../../application/services/reading.service";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { CreateReadingLegacyRequest } from "../../domain/schemas/dto/request/create.reading.request";

@Controller('readings')
export class ReadingController {
  constructor(private readonly readingService: ReadingService) {

  }

  @Post('create-reading-legacy')
  @MessagePattern('epaa-legacy.reading.create-reading-legacy')
  createReading(@Payload() reading: CreateReadingLegacyRequest) {
    console.log(`Received createReading request: ${JSON.stringify(reading)}`);
    return this.readingService.createReading(reading);
  }
}