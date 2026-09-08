import { Queries } from './queries/query';
import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfaceAccountingRepository } from '../../../../domain/contracts/accounting.interface.repository';
import {
  MonthlyDebtSummaryResponse,
  OverduePaymentResponse,
  OverdueSummaryResponse,
  PaymentReadingResponse,
  PaymentResponse,
  PendingReadingResponse,
  YearlyOverdueSummaryResponse,
} from '../../../../domain/schemas/dto/response/accounting.response';
import {
  MonthlyDebtSummarySqlResult,
  OverduePaymentSqlResponse,
  OverdueSummarySqlResult,
  PaymentReadingSqlResponse,
  PaymentSqlResponse,
  PendingReadingSQLResult,
  YearlyOverdueSummarySqlResult,
} from '../../../interfaces/sql/accounting.sql.response';
import { SQLServerAccountingAdapter } from '../adapters/sql-server.accounting.adapter';
import { statusCode } from '../../../../../../settings/environments/status-code';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class SQLServer2000AccountingPersistence implements InterfaceAccountingRepository {
  constructor(private readonly sqlServerService: DatabaseAbstract) {}

  async findAllPaymentByDateAndOrderValue(
    paymentDate: string,
    orderValue: number,
  ): Promise<PaymentResponse[]> {
    try {
      const query = Queries.findAllPaymentByDateAndOrderValue(
        paymentDate,
        orderValue,
      );
      const result =
        await this.sqlServerService.query<PaymentSqlResponse>(query);

      const response: PaymentResponse[] = result.map((item) =>
        SQLServerAccountingAdapter.fromPaymentSqlResponseToPaymentResponse(
          item,
        ),
      );

      return response;
    } catch (error) {
      console.error('Error al buscar pagos por fecha y valor de orden:', error);
      throw error;
    }
  }

  async findAllPaymentReadingPayrollsByDate(
    paymentDate: string,
  ): Promise<PaymentReadingResponse[]> {
    try {
      const query = Queries.findAllPaymentReadingPayrollsByDate(paymentDate);
      const result =
        await this.sqlServerService.query<PaymentReadingSqlResponse>(query);

      const response: PaymentReadingResponse[] = result.map((item) =>
        SQLServerAccountingAdapter.fromPaymentReadingSqlResponseToPaymentReadingResponse(
          item,
        ),
      );

      return response;
    } catch (error) {
      console.error('Error al buscar pagos por fecha y valor de orden:', error);
      throw error;
    }
  }

  async findAllPaymentByDate(paymentDate: string): Promise<PaymentResponse[]> {
    try {
      const query = Queries.findAllPaymentByDate(paymentDate);
      const result =
        await this.sqlServerService.query<PaymentSqlResponse>(query);

      const response: PaymentResponse[] = result.map((item) =>
        SQLServerAccountingAdapter.fromPaymentSqlResponseToPaymentResponse(
          item,
        ),
      );

      return response;
    } catch (error) {
      console.error('Error al buscar pagos por fecha y valor de orden:', error);
      throw error;
    }
  }

  async findAllPaymentByInitDateAndEndDate(
    initDate: string,
    endDate: string,
    limit?: number,
    offset?: number,
  ): Promise<PaymentResponse[]> {
    try {
      const initDateTime = `${String(initDate)} 00:00:00.000`;
      const endDateTime = `${String(endDate)} 23:59:59.997`;
      const safeOffset = Number.isInteger(offset) && offset! >= 0 ? offset! : 0;
      const safeLimit =
        Number.isInteger(limit) && limit! > 0 ? limit! : 2147483647;

      const offsetClause =
        safeOffset > 0
          ? `AND di.Cod_Ingreso NOT IN (
              SELECT TOP ${safeOffset} di2.Cod_Ingreso
              FROM Datos_ingreso di2
              INNER JOIN Valor v2 ON di2.Cod_Ingreso = v2.cod_Ingreso
              WHERE di2.Fecha_Pago >= CONVERT(DATETIME, '${initDateTime}', 120)
                AND di2.Fecha_Pago <= CONVERT(DATETIME, '${endDateTime}', 120)
              ORDER BY di2.Fecha_Ingreso DESC
            )`
          : '';

      const query = Queries.findAllPaymentByInitDateAndEndDate(
        initDate,
        endDate,
      );
      const result =
        await this.sqlServerService.query<PaymentSqlResponse>(query);

      const response: PaymentResponse[] = result.map((item) =>
        SQLServerAccountingAdapter.fromPaymentSqlResponseToPaymentResponse(
          item,
        ),
      );

      return response;
    } catch (error) {
      console.error('Error al buscar pagos por rango de fechas:', error);
      throw error;
    }
  }

  async findAllOverduePayments(
    limit?: number,
    offset?: number,
  ): Promise<OverduePaymentResponse[]> {
    try {
      const safeOffset = Number.isInteger(offset) && offset! >= 0 ? offset! : 0;
      const safeLimit =
        Number.isInteger(limit) && limit! > 0 ? limit! : 2147483647;

      const query = Queries.findAllOverduePayments(safeLimit, safeOffset);

      const result =
        await this.sqlServerService.query<OverduePaymentSqlResponse>(query);

      const response: OverduePaymentResponse[] = result.map((item) =>
        SQLServerAccountingAdapter.fromOverduePaymentSqlResponseToOverduePaymentResponse(
          item,
        ),
      );

      return response;
    } catch (error) {
      console.error('Error al buscar lecturas vencidas:', error);
      throw error;
    }
  }

  async findOverdueSummary(): Promise<OverdueSummaryResponse | null> {
    try {
      const query = Queries.findOverdueSummary();

      const result =
        await this.sqlServerService.query<OverdueSummarySqlResult>(query);

      if (result.length === 0) {
        return null;
      }

      return SQLServerAccountingAdapter.fromOverdueSummarySqlResultToOverdueSummaryResponse(
        result[0],
      );
    } catch (error) {
      console.error('Error al buscar el resumen de lecturas vencidas:', error);
      throw error;
    }
  }

  async findYearlyOverdueSummary(): Promise<YearlyOverdueSummaryResponse[]> {
    try {
      const query = Queries.findYearlyOverdueSummary();

      const result =
        await this.sqlServerService.query<YearlyOverdueSummarySqlResult>(query);

      return result.map((item) =>
        SQLServerAccountingAdapter.fromYearlySummarySqlResultToYearlySummaryResponse(
          item,
        ),
      );
    } catch (error) {
      console.error(
        'Error al buscar el resumen anual de lecturas vencidas:',
        error,
      );
      throw error;
    }
  }

  async findMonthlyDebtSummary(): Promise<MonthlyDebtSummaryResponse[]> {
    try {
      const query = Queries.findMonthlyDebtSummary();

      const result =
        await this.sqlServerService.query<MonthlyDebtSummarySqlResult>(query);

      return result.map((item) =>
        SQLServerAccountingAdapter.fromMonthlySummarySqlResultToMonthlySummaryResponse(
          item,
        ),
      );
    } catch (error) {
      throw error;
    }
  }

  async findPendingReadingsByCadastralKey(
    cadastralKey: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      const query = Queries.findPendingReadingsByCadastralKey(cadastralKey);

      const result =
        await this.sqlServerService.query<PendingReadingSQLResult>(query);
      return result.map(SQLServerAccountingAdapter.toDomainPending);
    } catch (error) {
      console.error(
        'Error al obtener lecturas pendientes por clave catastral:',
        error,
      );
      throw error;
    }
  }

  async findPendingReadingsByCardId(
    cardId: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      const query = Queries.findPendingReadingsByCardId(cardId);

      const result =
        await this.sqlServerService.query<PendingReadingSQLResult>(query);

      return result.map(SQLServerAccountingAdapter.toDomainPending);
    } catch (error) {
      console.error(
        'Error al obtener lecturas pendientes por identificación:',
        error,
      );
      throw error;
    }
  }

  async findPendingReadingsByCadastralKeyOrCardId(
    searchValue: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      const query =
        Queries.findPendingReadingsByCadastralKeyOrCardId(searchValue);

      const result =
        await this.sqlServerService.query<PendingReadingSQLResult>(query);

      return result.map(SQLServerAccountingAdapter.toDomainPending);
    } catch (error) {
      console.error(
        'Error al obtener lecturas pendientes por clave o identificación:',
        error,
      );
      throw error;
    }
  }

  async findPendingReadingsByCadastralKeyOrCardIdAll(
    searchValue: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      // For legacy consistency, this method uses the same query as findPendingReadingsByCadastralKeyOrCardId
      // as the base query already handles both cadastral key and card ID for all records.
      return this.findPendingReadingsByCadastralKeyOrCardId(searchValue);
    } catch (error) {
      throw error;
    }
  }

  async verifyReadingExists(searchValue: string): Promise<boolean> {
    try {
      const query = Queries.verifyReadingExists(searchValue);
      // Note: card_id might not exist in AP_LECTURAS directly, usually it's checked through ClaveCatastral
      // But for simplicity and matching the existing logic:
      const result = await this.sqlServerService.query(query);
      return result.length > 0;
    } catch (error) {
      console.error('Error al verificar existencia de lectura:', error);
      return false;
    }
  }

  async findHistoryInvoicesByCadastralKeyOrCardId(
    searchValue: string,
    period: { startDate: string; endDate: string },
  ): Promise<PendingReadingResponse[]> {
    try {
      const initDate = period.startDate
        .replace('T', ' ')
        .replace('Z', '')
        .split('.')[0];
      const endDate = period.endDate.split('T')[0] + ' 23:59:59.997';

      const query = Queries.findHistoryInvoicesByCadastralKeyOrCardId(
        searchValue,
        initDate,
        endDate,
      );
      const result =
        await this.sqlServerService.query<PendingReadingSQLResult>(query);
      return result.map(SQLServerAccountingAdapter.toDomainPending);
    } catch (error) {
      console.error(
        'Error al obtener historial de facturas por clave o identificación:',
        error,
      );
      throw error;
    }
  }
}
