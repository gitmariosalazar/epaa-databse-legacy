import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DateRangeParams } from '../../domain/schemas/dto/response/entry-data.response';
import { AccountingService } from '../../application/services/accounting.service';
import { raw } from 'express';
import {
  GeneralCollectionsParams,
  GeneralTrendCollectionsParams,
} from '../../domain/schemas/dto/request/general-collection.params';
import {
  AgreementsCustomerParams,
  AgreementsParams,
} from '../../domain/schemas/dto/request/agreements.params';

@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('find-payment-readings-by-payment-date')
  @MessagePattern(
    'epaa-legacy.accounting.find-payment-readings-by-payment-date',
  )
  findPaymentReadingsByPaymentDate(@Payload() paymentDate: string) {
    console.log(
      `Received findPaymentReadingsByPaymentDate request: ${JSON.stringify(paymentDate)}`,
    );
    return this.accountingService.findAllPaymentReadingPayrollsByDate(
      paymentDate,
    );
  }

  @Get('find-payment-by-payment-date-and-order')
  @MessagePattern(
    'epaa-legacy.accounting.find-payment-by-payment-date-and-order',
  )
  findPaymentByPaymentDateAndOrder(
    @Payload() data: { paymentDate: string; orderValue: number },
  ) {
    console.log(
      `Received findPaymentByPaymentDateAndOrder request: ${JSON.stringify(data)}`,
    );
    return this.accountingService.findAllPaymentByDateAndOrderValue(
      data.paymentDate,
      data.orderValue,
    );
  }

  @Get('find-payment-by-init-date-and-end-date')
  @MessagePattern(
    'epaa-legacy.accounting.find-payment-by-init-date-and-end-date',
  )
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
    return this.accountingService.findAllPaymentByInitDateAndEndDate(
      data.initDate,
      data.endDate,
      data.limit,
      data.offset,
    );
  }

  @Get('get-daily-grouped-report')
  @MessagePattern('epaa-legacy.accounting.get-daily-grouped-report')
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
    return this.accountingService.getDailyGroupedReport(params);
  }

  @Get('get-daily-collector-summary')
  @MessagePattern('epaa-legacy.accounting.get-daily-collector-summary')
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
    return this.accountingService.getDailyCollectorSummary(params);
  }

  @Get('get-daily-payment-method-report')
  @MessagePattern('epaa-legacy.accounting.get-daily-payment-method-report')
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
    return this.accountingService.getDailyPaymentMethodReport(params);
  }

  @Get('get-full-breakdown-report')
  @MessagePattern('epaa-legacy.accounting.get-full-breakdown-report')
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
    return this.accountingService.getFullBreakdownReport(params);
  }

  @Get('find-all-overdue-payments')
  @MessagePattern('epaa-legacy.accounting.find-all-overdue-payments')
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
    return this.accountingService.findAllOverduePayments(
      data.limit,
      data.offset,
    );
  }

  @Get('find-overdue-summary')
  @MessagePattern('epaa-legacy.accounting.find-overdue-summary')
  findOverdueSummary() {
    console.log(`Received findOverdueSummary request`);
    return this.accountingService.findOverdueSummary();
  }

  @Get('find-yearly-overdue-summary')
  @MessagePattern('epaa-legacy.accounting.find-yearly-overdue-summary')
  findYearlyOverdueSummary() {
    console.log(`Received findYearlyOverdueSummary request`);
    return this.accountingService.findYearlyOverdueSummary();
  }

  @Get('find-monthly-debt-summary')
  @MessagePattern('epaa-legacy.accounting.find-monthly-debt-summary')
  findMonthlyDebtSummary() {
    console.log(`Received findMonthlyDebtSummary request`);
    return this.accountingService.findMonthlyDebtSummary();
  }

  @Get('find-pending-readings-by-cadastral-key')
  @MessagePattern(
    'epaa-legacy.accounting.find-pending-readings-by-cadastral-key',
  )
  findPendingReadingsByCadastralKey(@Payload() cadastralKey: string) {
    console.log(
      `Received findPendingReadingsByCadastralKey request: ${JSON.stringify(cadastralKey)}`,
    );
    return this.accountingService.findPendingReadingsByCadastralKey(
      cadastralKey,
    );
  }

  @Get('find-pending-readings-by-card-id')
  @MessagePattern('epaa-legacy.accounting.find-pending-readings-by-card-id')
  findPendingReadingsByCardId(@Payload() cardId: string) {
    console.log(
      `Received findPendingReadingsByCardId request: ${JSON.stringify(cardId)}`,
    );
    return this.accountingService.findPendingReadingsByCardId(cardId);
  }

  @Get('find-pending-readings-by-cadastral-key-or-card-id')
  @MessagePattern(
    'epaa-legacy.accounting.find-pending-readings-by-cadastral-key-or-card-id',
  )
  findPendingReadingsByCadastralKeyOrCardId(@Payload() searchValue: string) {
    console.log(
      `Received findPendingReadingsByCadastralKeyOrCardId request: ${JSON.stringify(searchValue)}`,
    );
    return this.accountingService.findPendingReadingsByCadastralKeyOrCardId(
      searchValue,
    );
  }

  @Get('find-pending-readings-by-cadastral-key-or-card-id-all')
  @MessagePattern(
    'epaa-legacy.accounting.find-pending-readings-by-cadastral-key-or-card-id-all',
  )
  findPendingReadingsByCadastralKeyOrCardIdAll(@Payload() searchValue: string) {
    console.log(
      `Received findPendingReadingsByCadastralKeyOrCardIdAll request: ${JSON.stringify(searchValue)}`,
    );
    return this.accountingService.findPendingReadingsByCadastralKeyOrCardIdAll(
      searchValue,
    );
  }

  @Get('get-general-collection-kpi')
  @MessagePattern('epaa-legacy.accounting.get-general-collection-kpi')
  getGeneralCollectionKPI(@Payload() params: GeneralCollectionsParams) {
    console.log(
      `Received getGeneralCollectionKPI request: ${JSON.stringify(params)}`,
    );
    return this.accountingService.getGeneralCollectionKPI(params);
  }

  @Get('get-general-collection-report')
  @MessagePattern('epaa-legacy.accounting.get-general-collection-report')
  getGeneralCollectionReport(@Payload() params: GeneralCollectionsParams) {
    console.log(
      `Received getGeneralCollectionReport request: ${JSON.stringify(params)}`,
    );
    return this.accountingService.getGeneralCollectionReport(params);
  }

  @Get('get-general-daily-collection-grouped-report')
  @MessagePattern(
    'epaa-legacy.accounting.get-general-daily-collection-grouped-report',
  )
  getGeneralDailyCollectionGroupedReport(
    @Payload() params: GeneralCollectionsParams,
  ) {
    console.log(
      `Received getGeneralDailyCollectionGroupedReport request: ${JSON.stringify(params)}`,
    );
    return this.accountingService.getGeneralDailyCollectionGroupedReport(
      params,
    );
  }

  @Get('get-general-yearly-collection-grouped-report')
  @MessagePattern(
    'epaa-legacy.accounting.get-general-yearly-collection-grouped-report',
  )
  getGeneralYearlyCollectionGroupedReport(
    @Payload() params: GeneralTrendCollectionsParams,
  ) {
    console.log(
      `Received getGeneralYearlyCollectionGroupedReport request: ${JSON.stringify(params)}`,
    );
    return this.accountingService.getGeneralYearlyCollectionGroupedReport(
      params,
    );
  }

  @Get('get-general-monthly-collection-grouped-report')
  @MessagePattern(
    'epaa-legacy.accounting.get-general-monthly-collection-grouped-report',
  )
  getGeneralMonthlyCollectionGroupedReport(
    @Payload() params: GeneralTrendCollectionsParams,
  ) {
    console.log(
      `Received getGeneralMonthlyCollectionGroupedReport request: ${JSON.stringify(params)}`,
    );
    return this.accountingService.getGeneralMonthlyCollectionGroupedReport(
      params,
    );
  }

  @Get('get-general-yearly-collection-kpi')
  @MessagePattern('epaa-legacy.accounting.get-general-yearly-collection-kpi')
  getGeneralYearlyCollectionKPI(
    @Payload() params: GeneralTrendCollectionsParams,
  ) {
    console.log(
      `Received getGeneralYearlyCollectionKPI request: ${JSON.stringify(params)}`,
    );
    return this.accountingService.getGeneralYearlyCollectionKPI(params);
  }

  @Get('get-general-monthly-collection-kpi')
  @MessagePattern('epaa-legacy.accounting.get-general-monthly-collection-kpi')
  getGeneralMonthlyCollectionKPI(
    @Payload() params: GeneralTrendCollectionsParams,
  ) {
    console.log(
      `Received getGeneralMonthlyCollectionKPI request: ${JSON.stringify(params)}`,
    );
    return this.accountingService.getGeneralMonthlyCollectionKPI(params);
  }

  @Get('get-agreements-kpi')
  @MessagePattern('epaa-legacy.accounting.get-agreements-kpi')
  getAgreementsKpi(@Payload() params: AgreementsParams) {
    console.log(`Received getAgreementsKpi request: ${JSON.stringify(params)}`);
    return this.accountingService.getAgreementsKpi(params);
  }

  @Get('get-agreements-kpi-customer')
  @MessagePattern('epaa-legacy.accounting.get-agreements-kpi-customer')
  getAgreementsKpiCustomer(
    @Payload() data: { cardId: string; params: AgreementsCustomerParams },
  ) {
    console.log(
      `Received getAgreementsKpiCustomer request: ${JSON.stringify(data)}`,
    );
    return this.accountingService.getAgreementsKpiCustomer(
      data.cardId,
      data.params,
    );
  }

  @Get('get-agreement-installment-details')
  @MessagePattern('epaa-legacy.accounting.get-agreement-installment-details')
  getAgreementInstallmentDetails(
    @Payload() data: { cardId: string; params: DateRangeParams },
  ) {
    console.log(
      `Received getAgreementInstallmentDetails request: ${JSON.stringify(data)}`,
    );
    return this.accountingService.getAgreementInstallmentDetails(
      data.cardId,
      data.params,
    );
  }

  @Get('get-monthly-collection-summary')
  @MessagePattern('epaa-legacy.accounting.get-monthly-collection-summary')
  getMonthlyCollectionSummary(@Payload() monthsBack: number) {
    console.log(
      `Received getMonthlyCollectionSummary request: ${monthsBack}`,
    );
    return this.accountingService.getMonthlyCollectionSummary(monthsBack);
  }

  @Get('get-debtors-with-risk')
  @MessagePattern('epaa-legacy.accounting.get-debtors-with-risk')
  getDebtorsWithRisk() {
    console.log(`Received getDebtorsWithRisk request`);
    return this.accountingService.getDebtorsWithRisk();
  }

  @Get('get-collector-performance')
  @MessagePattern('epaa-legacy.accounting.get-collector-performance')
  getCollectorPerformance(@Payload() params: DateRangeParams) {
    console.log(
      `Received getCollectorPerformance request: ${JSON.stringify(params)}`,
    );
    return this.accountingService.getCollectorPerformance(params);
  }

  @Get('get-payment-method-summary')
  @MessagePattern('epaa-legacy.accounting.get-payment-method-summary')
  getPaymentMethodSummary(@Payload() params: DateRangeParams) {
    console.log(
      `Received getPaymentMethodSummary request: ${JSON.stringify(params)}`,
    );
    return this.accountingService.getPaymentMethodSummary(params);
  }

  @Get('get-citizen-summary')
  @MessagePattern('epaa-legacy.accounting.get-citizen-summary')
  getCitizenSummary(@Payload() params: DateRangeParams) {
    console.log(`Received getCitizenSummary request: ${JSON.stringify(params)}`);
    return this.accountingService.getCitizenSummary(params);
  }
}
