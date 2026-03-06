import { Injectable } from '@nestjs/common';
import { InterfaceTrashRateReportRepository } from '../../../../domain/contracts/trash-rate-report.interface.repository';
import { DatabaseServiceSQLServer2022 } from '../../../../../../shared/connections/database/sqlserver/sqlserver-2022.service';
import {
  ClientTrashDetailRowModel,
  CreditNoteRowModel,
  MissingValorRowModel,
  MonthlySummaryRowModel,
  TopDebtorRowModel,
  TrashDashboardKpiModel,
  TrashRateAuditRowModel,
} from '../../../../domain/models/trash-rate-report.model';
import {
  ClientTrashDetailRowSqlResult,
  CreditNoteRowSqlResult,
  MissingValorRowSqlResult,
  MonthlySummaryRowSqlResult,
  TopDebtorRowSqlResult,
  TrashDashboardKpiSqlResult,
  TrashRateAuditRowSqlResult,
} from '../../../interfaces/sql/trash-rate-report.sql-result';
import { TrashRateReportAdapter } from '../../../adapters/sql/trash-rate-report.adapter';

@Injectable()
export class SqlServer2022TrashRateReportPersistence
  implements InterfaceTrashRateReportRepository
{
  constructor(
    private readonly sqlServerService: DatabaseServiceSQLServer2022,
  ) {}

  async getTrashRateAuditReport(
    startDate: string,
    endDate: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<TrashRateAuditRowModel[]> {
    try {
      const initDateTime = `${String(startDate)} 00:00:00.000`;
      const endDateTime = `${String(endDate)} 23:59:59.997`;
      const query = `
        SET NOCOUNT ON;
        DECLARE @fechaInicio DATETIME
        DECLARE @fechaFin DATETIME
        SET @fechaInicio = CONVERT(DATETIME, '${initDateTime}', 120)
        SET @fechaFin    = CONVERT(DATETIME, '${endDateTime}', 120)

        SELECT
            di.Cod_Ingreso                                          AS bill_id,
            di.ClaveCatastral                                       AS cadastral_key,
            di.CodCliente_Ingreso                                   AS national_id,
            di.nombre                                               AS customer_name,
            CONVERT(VARCHAR(10), di.Fecha_Ingreso, 103)             AS issue_date,
            CONVERT(VARCHAR(10), di.Fecha_Pago, 103)                AS payment_date,
            di.Estado_Ingreso                                       AS payment_status_code,
            CASE
                WHEN di.Fecha_Pago IS NULL THEN 'PENDING'
                ELSE 'PAID'
            END                                                     AS payment_status,
            di.tasa_basura                                          AS rate_in_income,
            V.Valor                                                 AS rate_in_valor_table,
            ROUND(COALESCE(di.tasa_basura, 0) - COALESCE(V.Valor, 0), 2)
                                                                    AS difference,
            CASE
                WHEN V.cod_Ingreso IS NULL
                    THEN 'No record in Valor (Ord 10)'
                WHEN ABS(COALESCE(di.tasa_basura, 0) - COALESCE(V.Valor, 0)) < 0.01
                    THEN 'Correct Match'
                ELSE 'Different Value - Review'
            END                                                     AS diagnostic
        FROM Datos_ingreso di
        LEFT JOIN dbo.Valor V
            ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = 10
        WHERE di.Fecha_Ingreso >= @fechaInicio
          AND di.Fecha_Ingreso <= @fechaFin
          AND di.tasa_basura IS NOT NULL
        ORDER BY di.ClaveCatastral ASC, di.Cod_Ingreso ASC
        OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;
      `;

      const result: TrashRateAuditRowSqlResult[] =
        await this.sqlServerService.query<TrashRateAuditRowSqlResult>(query);

      const response: TrashRateAuditRowModel[] = result.map((row) =>
        TrashRateReportAdapter.fromTrashRateAuditRowResponseToTrashRateAuditRowModel(
          row,
        ),
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  async getActiveCreditNotes(
    startDate: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<CreditNoteRowModel[]> {
    try {
      const initDateTime = `${String(startDate)} 00:00:00.000`;
      const query = `
        SET NOCOUNT ON;
        DECLARE @fechaInicio DATETIME
        SET @fechaInicio = CONVERT(DATETIME, '${initDateTime}', 120)
        SELECT
            nc.Cuenta                                               AS cadastral_key,
            nc.CedulaCiudadano                                      AS national_id,
            ia.nombre                                               AS customer_name,
            ia.total_trash                                          AS total_trash_rate_history,
            ia.Max_Fecha_Ingreso                                    AS last_bill_issued,
            ia.Max_Fecha_Pago                                       AS last_payment_date,
            SUM(COALESCE(nc.Valor, 0))                              AS total_balance_in_favor,
            CAST(COUNT(nc.Cuenta) AS NUMERIC)                       AS credit_note_count,
            MAX(nc.Observacion)                                     AS observation,
            CASE
                WHEN SUM(COALESCE(nc.Valor, 0)) >= ia.total_trash_pendiente
                    THEN 'COVERS FULL DEBT'
                WHEN SUM(COALESCE(nc.Valor, 0)) > 0 AND ia.total_trash_pendiente > 0
                    THEN 'PARTIALLY COVERS'
                ELSE 'NOT APPLICABLE'
            END                                                     AS credit_coverage,
            ia.total_trash_pendiente                                AS pending_trash_debt,
            CASE
                WHEN SUM(COALESCE(nc.Valor, 0)) >= ia.total_trash_pendiente THEN 0
                ELSE ia.total_trash_pendiente - SUM(COALESCE(nc.Valor, 0))
            END                                                     AS remaining_debt_after_nc
        FROM (
            SELECT
                ClaveCatastral,
                CodCliente_Ingreso,
                nombre,
                MAX(Cod_Ingreso)                                    AS Max_Cod_Ingreso,
                SUM(COALESCE(tasa_basura, 0))                       AS total_trash,
                SUM(CASE
                    WHEN Fecha_Pago IS NULL THEN COALESCE(tasa_basura, 0)
                    ELSE 0
                END)                                                AS total_trash_pendiente,
                MAX(Fecha_Ingreso)                                  AS Max_Fecha_Ingreso,
                MAX(Fecha_Pago)                                     AS Max_Fecha_Pago
            FROM Datos_ingreso
            WHERE tasa_basura IS NOT NULL
              AND Fecha_Ingreso >= @fechaInicio
            GROUP BY ClaveCatastral, CodCliente_Ingreso, nombre
        ) ia
        INNER JOIN AP_NotasCredito nc
            ON ia.ClaveCatastral = nc.Cuenta
          AND ia.CodCliente_Ingreso = nc.CedulaCiudadano
        GROUP BY
            ia.Max_Cod_Ingreso,
            ia.ClaveCatastral,
            ia.CodCliente_Ingreso,
            ia.total_trash,
            ia.total_trash_pendiente,
            ia.nombre,
            ia.Max_Fecha_Ingreso,
            ia.Max_Fecha_Pago,
            nc.Cuenta,
            nc.CedulaCiudadano
        ORDER BY SUM(COALESCE(nc.Valor, 0)) DESC, ia.ClaveCatastral ASC
        OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;
      `;

      const result: CreditNoteRowSqlResult[] =
        await this.sqlServerService.query<CreditNoteRowSqlResult>(query);

      const response: CreditNoteRowModel[] = result.map((row) =>
        TrashRateReportAdapter.fromCreditNoteRowResponseToCreditNoteRowModel(
          row,
        ),
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  async getClientDetailSearch(
    searchParams: string,
  ): Promise<ClientTrashDetailRowModel[]> {
    try {
      const query = `
      SET NOCOUNT ON;
      DECLARE @searchParam VARCHAR(50)
      SET @searchParam = '${searchParams}'

      SELECT
          di.Cod_Ingreso                                          AS bill_id,
          di.ClaveCatastral                                       AS cadastral_key,
          di.CodCliente_Ingreso                                   AS national_id,
          di.nombre                                               AS customer_name,
          CONVERT(VARCHAR(10), di.Fecha_Ingreso, 103)             AS issue_date,
          CONVERT(VARCHAR(10), di.Fecha_Venc_Interes, 103)        AS due_date,
          CONVERT(VARCHAR(10), di.Fecha_Pago, 103)                AS payment_date,
          di.Estado_Ingreso                                       AS payment_status_code,
          di.tasa_basura                                          AS rate_in_income,
          V.Valor                                                 AS rate_in_valor_table,
          COALESCE(V.Valor, di.tasa_basura)                       AS official_rate,
          di.descuento_tb                                         AS discount_applied,
          COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)
                                                                  AS net_rate_to_pay,
          nc.Valor                                                AS credit_note_balance,
          nc.Observacion                                          AS credit_note_observation,
          CASE
              WHEN COALESCE(nc.Valor, 0) >= COALESCE(V.Valor, di.tasa_basura) THEN 0
              ELSE COALESCE(V.Valor, di.tasa_basura) - COALESCE(nc.Valor, 0)
          END                                                     AS effective_trash_to_pay,
          CASE
              WHEN COALESCE(nc.Valor, 0) > COALESCE(V.Valor, di.tasa_basura)
                  THEN nc.Valor - COALESCE(V.Valor, di.tasa_basura)
              ELSE 0
          END                                                     AS credit_note_leftover,
          CASE
              WHEN V.cod_Ingreso IS NULL                          THEN 'No Valor Table'
              WHEN ABS(COALESCE(di.tasa_basura, 0) - COALESCE(V.Valor, 0)) < 0.01
                                                                  THEN 'OK'
              ELSE 'Difference'
          END                                                     AS diagnostic
      FROM Datos_ingreso di
      LEFT JOIN dbo.Valor V
          ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = 10
      LEFT JOIN AP_NotasCredito nc
          ON di.ClaveCatastral = nc.Cuenta
      WHERE
          (
              (CHARINDEX('-', @searchParam) = 0 AND di.CodCliente_Ingreso = @searchParam)
              OR
              (CHARINDEX('-', @searchParam) > 0 AND di.ClaveCatastral = @searchParam)
          )
        AND di.tasa_basura IS NOT NULL
        AND di.Fecha_Ingreso >= '20260101'
      ORDER BY di.Fecha_Ingreso DESC;
      `;

      const result: ClientTrashDetailRowSqlResult[] =
        await this.sqlServerService.query<ClientTrashDetailRowSqlResult>(query);

      const response: ClientTrashDetailRowModel[] = result.map((row) =>
        TrashRateReportAdapter.fromClientTrashDetailRowResponseToClientTrashDetailRowModel(
          row,
        ),
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  async getDashboardKPITrashRate(
    startDate: string,
    endDate: string,
  ): Promise<TrashDashboardKpiModel[]> {
    try {
      const initDateTime = `${String(startDate)} 00:00:00.000`;
      const endDateTime = `${String(endDate)} 23:59:59.997`;
      const query = `
        DECLARE @fechaInicioKPI DATETIME
        DECLARE @fechaFinKPI DATETIME
        SET @fechaInicioKPI = CONVERT(DATETIME, '${initDateTime}', 120)
        SET @fechaFinKPI    = CONVERT(DATETIME, '${endDateTime}', 120)

        SELECT
            COUNT(di.Cod_Ingreso)                                   AS total_bills_issued,

            SUM(COALESCE(V.Valor, di.tasa_basura))                  AS total_to_collect,

            SUM(CASE
                WHEN di.Fecha_Pago IS NOT NULL
                    THEN COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)
                ELSE 0
            END)                                                    AS total_collected,

            SUM(CASE
                WHEN di.Fecha_Pago IS NULL
                    THEN COALESCE(V.Valor, di.tasa_basura)
                ELSE 0
            END)                                                    AS total_pending,

            CASE
                WHEN SUM(COALESCE(V.Valor, di.tasa_basura)) = 0 THEN 0
                ELSE ROUND(
                    CAST(SUM(CASE
                        WHEN di.Fecha_Pago IS NOT NULL
                            THEN COALESCE(V.Valor, di.tasa_basura)
                        ELSE 0
                    END) AS NUMERIC(18,4))
                    / SUM(COALESCE(V.Valor, di.tasa_basura)) * 100
                , 1)
            END                                                     AS compliance_pct,

            COUNT(DISTINCT di.ClaveCatastral)                       AS unique_cadastral_keys,

            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END)
                                                                    AS paid_bills,

            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS pending_bills,

            SUM(CASE WHEN V.cod_Ingreso IS NULL THEN 1 ELSE 0 END)  AS missing_valor_records

        FROM Datos_ingreso di
        LEFT JOIN dbo.Valor V
            ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = 10
        WHERE di.Fecha_Ingreso >= @fechaInicioKPI
          AND di.Fecha_Ingreso <= @fechaFinKPI
          AND di.tasa_basura IS NOT NULL;
      `;

      const result: TrashDashboardKpiSqlResult[] =
        await this.sqlServerService.query<TrashDashboardKpiSqlResult>(query);

      const response: TrashDashboardKpiModel[] = result.map((row) =>
        TrashRateReportAdapter.fromTrashDashboardKpiResponseToTrashDashboardKpiModel(
          row,
        ),
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  async getMissingValorBills(
    startDate: string,
    endDate: string,
  ): Promise<MissingValorRowModel[]> {
    try {
      const initDateTime = `${String(startDate)} 00:00:00.000`;
      const endDateTime = `${String(endDate)} 23:59:59.997`;
      const query = `
        SET NOCOUNT ON;
        DECLARE @fechaInicio3 DATETIME
        DECLARE @fechaFin3 DATETIME
        SET @fechaInicio3 = CONVERT(DATETIME, '${initDateTime}', 120)
        SET @fechaFin3    = CONVERT(DATETIME, '${endDateTime}', 120)

        SELECT
            di.Cod_Ingreso                                          AS bill_id,
            di.ClaveCatastral                                       AS cadastral_key,
            di.CodCliente_Ingreso                                   AS national_id,
            di.nombre                                               AS customer_name,
            CONVERT(VARCHAR(10), di.Fecha_Ingreso, 103)             AS issue_date,
            CONVERT(VARCHAR(10), di.Fecha_Pago, 103)                AS payment_date,
            di.tasa_basura                                          AS trash_rate,
            di.Estado_Ingreso                                       AS payment_status_code,
            CASE
                WHEN di.Fecha_Pago IS NULL THEN 'PENDING'
                ELSE 'PAID'
            END                                                     AS payment_status,
            'No record in Valor Table (Ord 10)'                     AS diagnostic,
            V.orden                                                 AS valor_order,
            di.tasa_basura                                          AS rate_in_income,
            V.Valor                                                 AS rate_in_valor_table
        FROM Datos_ingreso di
        LEFT JOIN dbo.Valor V
            ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = 10
        WHERE di.Fecha_Ingreso >= @fechaInicio3
          AND di.Fecha_Ingreso <= @fechaFin3
          AND di.tasa_basura IS NOT NULL
          AND V.cod_Ingreso IS NULL   -- Only those without a match
        -- AND di.Estado_Ingreso = 'N' -- uncomment for pending only
        ORDER BY di.Estado_Ingreso, di.ClaveCatastral;
      `;

      const result: MissingValorRowSqlResult[] =
        await this.sqlServerService.query<MissingValorRowSqlResult>(query);

      const response: MissingValorRowModel[] = result.map((row) =>
        TrashRateReportAdapter.fromMissingValorRowResponseToMissingValorRowModel(
          row,
        ),
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  async getMonthlySummaryReport(
    startDate: string,
    endDate: string,
  ): Promise<MonthlySummaryRowModel[]> {
    try {
      const initDateTime = `${String(startDate)} 00:00:00.000`;
      const endDateTime = `${String(endDate)} 23:59:59.997`;
      const query = `
        DECLARE @fechaInicio2 DATETIME
        DECLARE @fechaFin2 DATETIME
        SET @fechaInicio2 = CONVERT(DATETIME, '${initDateTime}', 120)
        SET @fechaFin2    = CONVERT(DATETIME, '${endDateTime}', 120)

        SELECT
            di.Estado_Ingreso                                       AS payment_status_code,
            V.orden                                                 AS valor_order,
            COUNT(di.Cod_Ingreso)                                   AS bill_count,
            SUM(COALESCE(di.tasa_basura, 0))                        AS total_rate_income,
            SUM(COALESCE(V.Valor, 0))                               AS total_rate_valor_table,
            SUM(COALESCE(di.descuento_tb, 0))                       AS total_discounts,
            SUM(COALESCE(V.Valor, 0) - COALESCE(di.descuento_tb, 0))
                                                                    AS total_trash_net,
            SUM(CASE WHEN V.cod_Ingreso IS NULL THEN 1 ELSE 0 END)  AS missing_valor_records
        FROM Datos_ingreso di
        LEFT JOIN dbo.Valor V
            ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = 10
        WHERE di.Fecha_Ingreso >= @fechaInicio2
          AND di.Fecha_Ingreso <= @fechaFin2
          AND di.tasa_basura IS NOT NULL
        GROUP BY di.Estado_Ingreso, V.orden
        ORDER BY di.Estado_Ingreso;
      `;

      const result: MonthlySummaryRowSqlResult[] =
        await this.sqlServerService.query<MonthlySummaryRowSqlResult>(query);

      const response: MonthlySummaryRowModel[] = result.map((row) =>
        TrashRateReportAdapter.fromMonthlySummaryRowResponseToMonthlySummaryRowModel(
          row,
        ),
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  async getTopDebtorReport(
    startDate: string,
    endDate: string,
    top: number,
  ): Promise<TopDebtorRowModel[]> {
    try {
      const initDateTime = `${String(startDate)} 00:00:00.000`;
      const endDateTime = `${String(endDate)} 23:59:59.997`;
      const query = `
        DECLARE @fechaInicioTop DATETIME
        DECLARE @fechaFinTop DATETIME
        SET @fechaInicioTop = CONVERT(DATETIME, '${initDateTime}', 120)
        SET @fechaFinTop    = CONVERT(DATETIME, '${endDateTime}', 120)

        SELECT TOP ${top}
            di.ClaveCatastral                                       AS cadastral_key,
            di.CodCliente_Ingreso                                   AS national_id,
            di.nombre                                               AS customer_name,
            COUNT(di.Cod_Ingreso)                                   AS unpaid_months,
            SUM(COALESCE(V.Valor, di.tasa_basura))                  AS total_trash_debt,
            MIN(di.Fecha_Ingreso)                                   AS oldest_debt_date,
            MAX(di.Fecha_Ingreso)                                   AS latest_pending_bill
        FROM Datos_ingreso di
        LEFT JOIN dbo.Valor V
            ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = 10
        WHERE di.Fecha_Pago IS NULL
          AND di.tasa_basura IS NOT NULL
          AND di.Fecha_Ingreso >= @fechaInicioTop
          AND di.Fecha_Ingreso <= @fechaFinTop
        GROUP BY di.ClaveCatastral, di.CodCliente_Ingreso, di.nombre
        ORDER BY total_trash_debt DESC;
      `;

      const result: TopDebtorRowSqlResult[] =
        await this.sqlServerService.query<TopDebtorRowSqlResult>(query);

      const response: TopDebtorRowModel[] = result.map((row) =>
        TrashRateReportAdapter.fromTopDebtorRowResponseToTopDebtorRowModel(row),
      );

      return response;
    } catch (error) {
      throw error;
    }
  }
}
