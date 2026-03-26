import { Controller, Get, Post, Put } from '@nestjs/common';
import { ReadingService } from '../../application/services/reading.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateReadingLegacyRequest } from '../../domain/schemas/dto/request/create.reading.request';
import { FindCurrentReadingParams } from '../../domain/schemas/dto/request/find-current-reading.paramss';
import { UpdateReadingRequest } from '../../domain/schemas/dto/request/update.reading.request';
import { ReadingNotFoundException } from '../../domain/exceptions/reading-not-found.exception';
import { DateRangeParams } from '../../domain/schemas/dto/response/entry-data.response';

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
  @MessagePattern(
    'epaa-legacy.reading.find-pending-reading-by-cadastral-key-or-card-id',
  )
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

  @Get('find-pending-reading-by-cadastral-key-or-card-id-all')
  @MessagePattern(
    'epaa-legacy.reading.find-pending-reading-by-cadastral-key-or-card-id-all',
  )
  findPendingReadingByCadastralKeyOrCardIdAll(
    @Payload()
    params: {
      searchValue: string;
    },
  ) {
    console.log(
      `Received findPendingReadingByCadastralKeyOrCardIdAll request: ${JSON.stringify(params)}`,
    );
    return this.readingService.findPendingReadingsByCadastralKeyOrCardIdAll(
      params.searchValue,
    );
  }

  @Get('find-payment-readings-by-payment-date')
  @MessagePattern('epaa-legacy.reading.find-payment-readings-by-payment-date')
  findPaymentReadingsByPaymentDate(@Payload() paymentDate: string) {
    console.log(
      `Received findPaymentReadingsByPaymentDate request: ${JSON.stringify(paymentDate)}`,
    );
    return this.readingService.findAllPaymentReadingPayrollsByDate(paymentDate);
  }

  @Get('find-payment-by-payment-date-and-order')
  @MessagePattern('epaa-legacy.reading.find-payment-by-payment-date-and-order')
  findPaymentByPaymentDateAndOrder(
    @Payload() data: { paymentDate: string; orderValue: number },
  ) {
    console.log(
      `Received findPaymentByPaymentDateAndOrder request: ${JSON.stringify(data)}`,
    );
    return this.readingService.findAllPaymentByDateAndOrderValue(
      data.paymentDate,
      data.orderValue,
    );
  }

  @Get('find-payment-by-init-date-and-end-date')
  @MessagePattern('epaa-legacy.reading.find-payment-by-init-date-and-end-date')
  findPaymentByInitDateAndEndDate(
    @Payload()
    data: {
      initDate: string;
      endDate: string;
      limit?: number;
      offset?: number;
    },
  ) {
    console.log(
      `Received findPaymentByInitDateAndEndDate request: ${JSON.stringify(data)}`,
    );
    return this.readingService.findAllPaymentByInitDateAndEndDate(
      data.initDate,
      data.endDate,
      data.limit,
      data.offset,
    );
  }

  @Get('get-daily-grouped-report')
  @MessagePattern('epaa-legacy.reading.get-daily-grouped-report')
  getDailyGroupedReport(
    @Payload() raw: { initDate?: string; endDate?: string; startDate?: string },
  ) {
    console.log(
      `Received getDailyGroupedReport request: ${JSON.stringify(raw)}`,
    );
    const params = new DateRangeParams(
      raw.startDate ?? raw.initDate ?? '',
      raw.endDate ?? '',
    );
    return this.readingService.getDailyGroupedReport(params);
  }

  @Get('get-daily-collector-summary')
  @MessagePattern('epaa-legacy.reading.get-daily-collector-summary')
  getDailyCollectorSummary(
    @Payload() raw: { initDate?: string; endDate?: string; startDate?: string },
  ) {
    console.log(
      `Received getDailyCollectorSummary request: ${JSON.stringify(raw)}`,
    );
    const params = new DateRangeParams(
      raw.startDate ?? raw.initDate ?? '',
      raw.endDate ?? '',
    );
    return this.readingService.getDailyCollectorSummary(params);
  }

  @Get('get-daily-payment-method-report')
  @MessagePattern('epaa-legacy.reading.get-daily-payment-method-report')
  getDailyPaymentMethodReport(
    @Payload() raw: { initDate?: string; endDate?: string; startDate?: string },
  ) {
    console.log(
      `Received getDailyPaymentMethodReport request: ${JSON.stringify(raw)}`,
    );
    const params = new DateRangeParams(
      raw.startDate ?? raw.initDate ?? '',
      raw.endDate ?? '',
    );
    return this.readingService.getDailyPaymentMethodReport(params);
  }

  @Get('get-full-breakdown-report')
  @MessagePattern('epaa-legacy.reading.get-full-breakdown-report')
  getFullBreakdownReport(
    @Payload() raw: { initDate?: string; endDate?: string; startDate?: string },
  ) {
    console.log(
      `Received getFullBreakdownReport request: ${JSON.stringify(raw)}`,
    );
    const params = new DateRangeParams(
      raw.startDate ?? raw.initDate ?? '',
      raw.endDate ?? '',
    );
    return this.readingService.getFullBreakdownReport(params);
  }

  @Get('find-all-overdue-payments')
  @MessagePattern('epaa-legacy.reading.find-all-overdue-payments')
  findAllOverduePayments(
    @Payload()
    data: {
      limit?: number;
      offset?: number;
    },
  ) {
    console.log(
      `Received findAllOverduePayments request: ${JSON.stringify(data)}`,
    );
    return this.readingService.findAllOverduePayments(data.limit, data.offset);
  }
}
