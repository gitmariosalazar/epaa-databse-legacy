import {
  AgreementsCustomerParams,
  AgreementsParams,
} from '../../domain/schemas/dto/request/agreements.params';
import {
  AgreementInstallmentResponse,
  AgreementKPIsCustomerResponse,
  AgreementKPIsResponse,
  CitizenSummary,
  CollectorPerformance,
  Debtor,
  MonthlyCollectionSummary,
  PaymentMethodSummary,
} from '../../domain/schemas/dto/response/agreements.response';
import { DateRangeParams } from '../../domain/schemas/dto/response/entry-data.response';

export interface InterfaceAgreementsUseCase {
  getAgreementsKpi(params: AgreementsParams): Promise<AgreementKPIsResponse[]>;
  getAgreementsKpiCustomer(
    cardId: string,
    params: AgreementsCustomerParams,
  ): Promise<AgreementKPIsCustomerResponse[]>;
  getAgreementInstallmentDetails(
    cardId: string,
    params: DateRangeParams,
  ): Promise<AgreementInstallmentResponse[]>; // Aquí puedes definir un tipo específico para los detalles de las cuotas si lo deseas

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
