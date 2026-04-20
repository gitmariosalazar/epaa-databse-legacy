import {
  AgreementsCustomerParams,
  AgreementsParams,
} from '../schemas/dto/request/agreements.params';
import {
  AgreementInstallmentResponse,
  AgreementKPIsCustomerResponse,
  AgreementKPIsResponse,
  CitizenSummary,
  CollectorPerformance,
  Debtor,
  MonthlyCollectionSummary,
  PaymentMethodSummary,
} from '../schemas/dto/response/agreements.response';
import { DateRangeParams } from '../schemas/dto/response/entry-data.response';

export interface InterfaceAgreementsRepository {
  getAgreementsKpi(params: AgreementsParams): Promise<AgreementKPIsResponse[]>;
  getAgreementsKpiCustomer(
    cardId: string,
    params: AgreementsCustomerParams,
  ): Promise<AgreementKPIsCustomerResponse[]>;
  getAgreementInstallmentDetails(
    cardId: string,
    params: DateRangeParams,
  ): Promise<AgreementInstallmentResponse[]>;

  // Nuevos reportes
  getMonthlyCollectionSummary(
    monthsBack: number,
  ): Promise<MonthlyCollectionSummary[]>;
  getDebtorsWithRisk(): Promise<Debtor[]>;
  getCollectorPerformance(
    params: DateRangeParams,
  ): Promise<CollectorPerformance[]>;
  getPaymentMethodSummary(
    params: DateRangeParams,
  ): Promise<PaymentMethodSummary[]>;
  getCitizenSummary(params: DateRangeParams): Promise<CitizenSummary[]>;
}
