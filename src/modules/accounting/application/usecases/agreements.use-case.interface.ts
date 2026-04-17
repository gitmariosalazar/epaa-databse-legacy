import { AgreementsParams } from '../../domain/schemas/dto/request/agreements.params';
import { AgreementKPIsResponse } from '../../domain/schemas/dto/response/agreements.response';

export interface InterfaceAgreementsUseCase {
  getAgreementsKpi(params: AgreementsParams): Promise<AgreementKPIsResponse[]>;
}
