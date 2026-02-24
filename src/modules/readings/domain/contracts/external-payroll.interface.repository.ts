import { ExternalPayrollItem } from '../schemas/dto/response/external-payroll.response';

export interface InterfaceExternalPayrollRepository {
  getPayrollsByIdentification(
    identification: string,
  ): Promise<ExternalPayrollItem[]>;
}
