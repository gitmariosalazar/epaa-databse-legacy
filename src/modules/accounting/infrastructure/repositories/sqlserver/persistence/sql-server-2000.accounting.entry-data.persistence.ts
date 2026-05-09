import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfaceEntryDataRepository } from '../../../../domain/contracts/entry-data.interface.repository';
import {
  DailyCollectorSummary,
  DailyGroupedReport,
  DailyPaymentMethodReport,
  DateRangeParams,
  FullBreakdownReport,
} from '../../../../domain/schemas/dto/response/entry-data.response';
import {
  DailyCollectorSummarySQLResult,
  DailyGroupedReportSQLResult,
  DailyPaymentMethodReportSQLResult,
  FullBreakdownReportSQLResult,
} from '../../../interfaces/sql/entry-data.sql.response';
import { SQLServerAccountingEntryDataAdapter } from '../adapters/sql-server.accounting.entry-data.adapter';

@Injectable()
export class SQLServer2000EntryDataPersistence
  implements InterfaceEntryDataRepository
{
  constructor(private readonly sqlServerService: DatabaseAbstract) {}

  async getDailyCollectorSummary(
    params: DateRangeParams,
  ): Promise<DailyCollectorSummary[]> {
    try {
      const initDate = params.startDate
        .replace('T', ' ')
        .replace('Z', '')
        .split('.')[0];
      const endDate = params.endDate.split('T')[0] + ' 23:59:59.997';
      const query = `
        SET NOCOUNT ON;
        SET ANSI_WARNINGS OFF;
        SELECT
            i.date,
              i.collector,
              i.total_collected,
              i.payment_count,
              i.title_value,
              i.third_party_value,
              i.surcharge_value,
              i.trash_rate_value,
              i.discount_trash_rate_value,
              COALESCE(d.detail_value, 0)                      AS detail_value,
              CASE
                  WHEN ABS(i.title_value - COALESCE(d.detail_value, 0)) < 0.01
                  THEN 'OK'
                  ELSE 'DIFERENCIA'
              END                                              AS validate,
              ROUND(i.title_value - COALESCE(d.detail_value, 0), 2) AS difference
          FROM (
              SELECT
                  CONVERT(VARCHAR(10), Fecha_Pago, 120)        AS date,
                  User_Cobro                                   AS collector,
                  SUM(
                      COALESCE(Valor_Titulo,  0) +
                      COALESCE(ValorTerceros, 0) +
                      COALESCE(Recargo,       0) +
                      COALESCE(tasa_basura,   0) -
                      COALESCE(descuento_tb,  0)
                  )                                            AS total_collected,
                  COUNT(Cod_Ingreso)                           AS payment_count,
                  SUM(COALESCE(Valor_Titulo,  0))              AS title_value,
                  SUM(COALESCE(ValorTerceros, 0))              AS third_party_value,
                  SUM(COALESCE(Recargo,       0))              AS surcharge_value,
                  SUM(COALESCE(tasa_basura,   0))              AS trash_rate_value,
                  SUM(COALESCE(descuento_tb,  0))              AS discount_trash_rate_value
              FROM Datos_ingreso
              WHERE Fecha_Pago >= CONVERT(DATETIME, '${initDate}', 120)
                AND Fecha_Pago <= CONVERT(DATETIME, '${endDate}',  120)
              GROUP BY
                  CONVERT(VARCHAR(10), Fecha_Pago, 120),
                  User_Cobro
          ) i
          LEFT JOIN (
              SELECT
                  CONVERT(VARCHAR(10), di.Fecha_Pago, 120)    AS date,
                  di.User_Cobro                               AS collector,
                  SUM(COALESCE(v.Valor, 0))                   AS detail_value
              FROM Datos_ingreso di
              INNER JOIN Valor v ON di.Cod_Ingreso = v.cod_Ingreso
              WHERE di.Fecha_Pago >= CONVERT(DATETIME, '${initDate}', 120)
                AND di.Fecha_Pago <= CONVERT(DATETIME, '${endDate}',  120)
              GROUP BY
                  CONVERT(VARCHAR(10), di.Fecha_Pago, 120),
                  di.User_Cobro
          ) d
              ON  i.date      = d.date
              AND i.collector = d.collector
          ORDER BY
              i.date,
              i.total_collected DESC;
      `;
      const result =
        await this.sqlServerService.query<DailyCollectorSummarySQLResult>(
          query,
        );

      return result.map(
        SQLServerAccountingEntryDataAdapter.toDomainDailyCollectorSummary,
      );
    } catch (error) {
      console.error('Error al buscar el resumen diario de cobradores:', error);
      throw error;
    }
  }

  async getDailyGroupedReport(
    params: DateRangeParams,
  ): Promise<DailyGroupedReport[]> {
    try {
      const initDate = params.startDate
        .replace('T', ' ')
        .replace('Z', '')
        .split('.')[0];
      const endDate = params.endDate.split('T')[0] + ' 23:59:59.997';
      const query = `
        SET NOCOUNT ON;
        SET ANSI_WARNINGS OFF;
        SELECT
            i.day,
              i.date,
              i.collector,
              i.title_code,
              i.payment_method,
              i.status,
              i.title_value,
              i.third_party_value,
              i.surcharge_value,
              i.trash_rate_value,
              i.discount_trash_rate_value,
              i.total_value,
              i.record_count,
              COALESCE(d.detail_value, 0)                      AS detail_value,
              CASE
                  WHEN ABS(i.title_value - COALESCE(d.detail_value, 0)) < 0.01
                  THEN 'OK'
                  ELSE 'DIFERENCIA'
              END                                              AS validate,
              ROUND(i.title_value - COALESCE(d.detail_value, 0), 2) AS difference
          FROM (
              SELECT
                  CONVERT(VARCHAR(8),  Fecha_Pago, 112)        AS day,
                  CONVERT(VARCHAR(10), Fecha_Pago, 120)        AS date,
                  User_Cobro                                   AS collector,
                  Cod_Titulo_Datos                             AS title_code,
                  FormaDePago                                  AS payment_method,
                  Estado_Ingreso                               AS status,
                  SUM(COALESCE(Valor_Titulo,  0))              AS title_value,
                  SUM(COALESCE(ValorTerceros, 0))              AS third_party_value,
                  SUM(COALESCE(Recargo,       0))              AS surcharge_value,
                  SUM(COALESCE(tasa_basura,   0))              AS trash_rate_value,
                  SUM(COALESCE(descuento_tb,  0))              AS discount_trash_rate_value,
                  SUM(
                      COALESCE(Valor_Titulo,  0) +
                      COALESCE(ValorTerceros, 0) +
                      COALESCE(Recargo,       0) +
                      COALESCE(tasa_basura,   0) -
                      COALESCE(descuento_tb,  0)
                  )                                            AS total_value,
                  COUNT(Cod_Ingreso)                           AS record_count
              FROM Datos_ingreso
              WHERE Fecha_Pago >= CONVERT(DATETIME, '${initDate}', 120)
                AND Fecha_Pago <= CONVERT(DATETIME, '${endDate}',  120)
              GROUP BY
                  CONVERT(VARCHAR(8),  Fecha_Pago, 112),
                  CONVERT(VARCHAR(10), Fecha_Pago, 120),
                  User_Cobro, Cod_Titulo_Datos, FormaDePago, Estado_Ingreso
          ) i
          LEFT JOIN (
              SELECT
                  CONVERT(VARCHAR(8),  di.Fecha_Pago, 112)    AS day,
                  di.User_Cobro                               AS collector,
                  di.Cod_Titulo_Datos                         AS title_code,
                  di.FormaDePago                              AS payment_method,
                  di.Estado_Ingreso                           AS status,
                  SUM(COALESCE(v.Valor, 0))                   AS detail_value
              FROM Datos_ingreso di
              INNER JOIN Valor v ON di.Cod_Ingreso = v.cod_Ingreso
              WHERE di.Fecha_Pago >= CONVERT(DATETIME, '${initDate}', 120)
                AND di.Fecha_Pago <= CONVERT(DATETIME, '${endDate}',  120)
              GROUP BY
                  CONVERT(VARCHAR(8),  di.Fecha_Pago, 112),
                  di.User_Cobro, di.Cod_Titulo_Datos, di.FormaDePago, di.Estado_Ingreso
          ) d
              ON  i.day            = d.day
              AND i.collector      = d.collector
              AND i.title_code     = d.title_code
              AND i.payment_method = d.payment_method
              AND i.status         = d.status
          ORDER BY
              i.day,
              i.collector,
              i.title_code,
              i.payment_method
      `;
      const result =
        await this.sqlServerService.query<DailyGroupedReportSQLResult>(query);

      return result.map(
        SQLServerAccountingEntryDataAdapter.toDomainDailyGroupedReport,
      );
    } catch (error) {
      console.error('Error al buscar el resumen diario de cobradores:', error);
      throw error;
    }
  }

  async getDailyPaymentMethodReport(
    params: DateRangeParams,
  ): Promise<DailyPaymentMethodReport[]> {
    try {
      const initDate = params.startDate
        .replace('T', ' ')
        .replace('Z', '')
        .split('.')[0];
      const endDate = params.endDate.split('T')[0] + ' 23:59:59.997';
      const query = `
        SET NOCOUNT ON;
        SET ANSI_WARNINGS OFF;
        SELECT
            i.date,
              i.payment_method,
              i.status,
              i.total,
              i.record_count,
              i.title_value,
              i.third_party_value,
              i.surcharge_value,
              i.trash_rate_value,
              i.discount_trash_rate_value,
              COALESCE(d.detail_value, 0)                      AS detail_value,
              CASE
                  WHEN ABS(i.title_value - COALESCE(d.detail_value, 0)) < 0.01
                  THEN 'OK'
                  ELSE 'DIFERENCIA'
              END                                              AS validate,
              ROUND(i.title_value - COALESCE(d.detail_value, 0), 2) AS difference
          FROM (
              SELECT
                  CONVERT(VARCHAR(10), Fecha_Pago, 120)        AS date,
                  FormaDePago                                  AS payment_method,
                  Estado_Ingreso                               AS status,
                  SUM(
                      COALESCE(Valor_Titulo,  0) +
                      COALESCE(ValorTerceros, 0) +
                      COALESCE(Recargo,       0) +
                      COALESCE(tasa_basura,   0) -
                      COALESCE(descuento_tb,  0)
                  )                                            AS total,
                  COUNT(Cod_Ingreso)                           AS record_count,
                  SUM(COALESCE(Valor_Titulo,  0))              AS title_value,
                  SUM(COALESCE(ValorTerceros, 0))              AS third_party_value,
                  SUM(COALESCE(Recargo,       0))              AS surcharge_value,
                  SUM(COALESCE(tasa_basura,   0))              AS trash_rate_value,
                  SUM(COALESCE(descuento_tb,  0))              AS discount_trash_rate_value
              FROM Datos_ingreso
              WHERE Fecha_Pago >= CONVERT(DATETIME, '${initDate}', 120)
                AND Fecha_Pago <= CONVERT(DATETIME, '${endDate}',  120)
              GROUP BY
                  CONVERT(VARCHAR(10), Fecha_Pago, 120),
                  FormaDePago, Estado_Ingreso
          ) i
          LEFT JOIN (
              SELECT
                  CONVERT(VARCHAR(10), di.Fecha_Pago, 120)    AS date,
                  di.FormaDePago                              AS payment_method,
                  di.Estado_Ingreso                           AS status,
                  SUM(COALESCE(v.Valor, 0))                   AS detail_value
              FROM Datos_ingreso di
              INNER JOIN Valor v ON di.Cod_Ingreso = v.cod_Ingreso
              WHERE di.Fecha_Pago >= CONVERT(DATETIME, '${initDate}', 120)
                AND di.Fecha_Pago <= CONVERT(DATETIME, '${endDate}',  120)
              GROUP BY
                  CONVERT(VARCHAR(10), di.Fecha_Pago, 120),
                  di.FormaDePago, di.Estado_Ingreso
          ) d
              ON  i.date           = d.date
              AND i.payment_method = d.payment_method
              AND i.status         = d.status
          ORDER BY
              i.date,
              i.payment_method
      `;
      const result =
        await this.sqlServerService.query<DailyPaymentMethodReportSQLResult>(
          query,
        );

      return result.map(
        SQLServerAccountingEntryDataAdapter.toDomainDailyPaymentMethodReport,
      );
    } catch (error) {
      console.error('Error al buscar el resumen diario de cobradores:', error);
      throw error;
    }
  }

  async getFullBreakdownReport(
    params: DateRangeParams,
  ): Promise<FullBreakdownReport[]> {
    try {
      const initDate = params.startDate
        .replace('T', ' ')
        .replace('Z', '')
        .split('.')[0];
      const endDate = params.endDate.split('T')[0] + ' 23:59:59.997';
      const query = `
        SET NOCOUNT ON;
        SET ANSI_WARNINGS OFF;
        SELECT
            i.date,
              i.collector,
              i.title_code,
              i.payment_method,
              i.status,
              i.title_value,
              i.third_party_value,
              i.surcharge_value,
              i.trash_rate_value,
              i.discount_trash_rate_value,
              i.grand_total,
              i.income_count,
              COALESCE(d.detail_value, 0)                      AS detail_value,
              CASE
                  WHEN ABS(i.title_value - COALESCE(d.detail_value, 0)) < 0.01
                  THEN 'OK'
                  ELSE 'DIFERENCIA'
              END                                              AS validate,
              ROUND(i.title_value - COALESCE(d.detail_value, 0), 2) AS difference
          FROM (
              SELECT
                  CONVERT(VARCHAR(10), Fecha_Pago, 120)        AS date,
                  User_Cobro                                   AS collector,
                  Cod_Titulo_Datos                             AS title_code,
                  FormaDePago                                  AS payment_method,
                  Estado_Ingreso                               AS status,
                  SUM(COALESCE(Valor_Titulo,  0))              AS title_value,
                  SUM(COALESCE(ValorTerceros, 0))              AS third_party_value,
                  SUM(COALESCE(Recargo,       0))              AS surcharge_value,
                  SUM(COALESCE(tasa_basura,   0))              AS trash_rate_value,
                  SUM(COALESCE(descuento_tb,  0))              AS discount_trash_rate_value,
                  SUM(
                      COALESCE(Valor_Titulo,  0) +
                      COALESCE(ValorTerceros, 0) +
                      COALESCE(Recargo,       0) +
                      COALESCE(tasa_basura,   0) -
                      COALESCE(descuento_tb,  0)
                  )                                            AS grand_total,
                  COUNT(DISTINCT Cod_Ingreso)                  AS income_count
              FROM Datos_ingreso
              WHERE Fecha_Pago >= CONVERT(DATETIME, '${initDate}', 120)
                AND Fecha_Pago <= CONVERT(DATETIME, '${endDate}',  120)
              GROUP BY
                  CONVERT(VARCHAR(10), Fecha_Pago, 120),
                  User_Cobro, Cod_Titulo_Datos, FormaDePago, Estado_Ingreso
          ) i
          LEFT JOIN (
              SELECT
                  CONVERT(VARCHAR(10), di.Fecha_Pago, 120)    AS date,
                  di.User_Cobro                               AS collector,
                  di.Cod_Titulo_Datos                         AS title_code,
                  di.FormaDePago                              AS payment_method,
                  di.Estado_Ingreso                           AS status,
                  SUM(COALESCE(v.Valor, 0))                   AS detail_value
              FROM Datos_ingreso di
              INNER JOIN Valor v ON di.Cod_Ingreso = v.cod_Ingreso
              WHERE di.Fecha_Pago >= CONVERT(DATETIME, '${initDate}', 120)
                AND di.Fecha_Pago <= CONVERT(DATETIME, '${endDate}',  120)
              GROUP BY
                  CONVERT(VARCHAR(10), di.Fecha_Pago, 120),
                  di.User_Cobro, di.Cod_Titulo_Datos, di.FormaDePago, di.Estado_Ingreso
          ) d
              ON  i.date           = d.date
              AND i.collector      = d.collector
              AND i.title_code     = d.title_code
              AND i.payment_method = d.payment_method
              AND i.status         = d.status
          ORDER BY
              i.date,
              i.collector,
              i.title_code
      `;
      const result =
        await this.sqlServerService.query<FullBreakdownReportSQLResult>(query);

      return result.map(
        SQLServerAccountingEntryDataAdapter.toDomainFullBreakdownReport,
      );
    } catch (error) {
      console.error('Error al buscar el resumen diario de cobradores:', error);
      throw error;
    }
  }
}
