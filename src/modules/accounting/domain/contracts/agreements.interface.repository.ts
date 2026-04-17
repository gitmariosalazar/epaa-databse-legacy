import { AgreementsParams } from '../schemas/dto/request/agreements.params';
import { AgreementKPIsResponse } from '../schemas/dto/response/agreements.response';

export interface InterfaceAgreementsRepository {
  getAgreementsKpi(params: AgreementsParams): Promise<AgreementKPIsResponse[]>;
}
