import { Injectable, Logger } from '@nestjs/common';
import { InterfaceExternalPayrollRepository } from '../../../../domain/contracts/external-payroll.interface.repository';
import {
  ExternalPayrollItem,
  ExternalPayrollResponse,
} from '../../../../domain/schemas/dto/response/external-payroll.response';

@Injectable()
export class ExternalPayrollPersistence implements InterfaceExternalPayrollRepository {
  private readonly logger = new Logger(ExternalPayrollPersistence.name);
  private readonly baseUrl = 'http://181.112.159.150/api/commercial/payrolls';

  async getPayrollsByIdentification(
    identification: string,
  ): Promise<ExternalPayrollItem[]> {
    try {
      const url = `${this.baseUrl}?identification=${identification}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.error(
          `External API error: Status ${response.status} for identification ${identification}`,
        );
        return [];
      }

      const result = (await response.json()) as ExternalPayrollResponse;

      if (
        result &&
        result.data &&
        result.data.success &&
        Array.isArray(result.data.data)
      ) {
        return result.data.data;
      }

      return [];
    } catch (error) {
      this.logger.error(
        `Failed to fetch payrolls for identification ${identification}`,
        error,
      );
      return [];
    }
  }
}
