import { Injectable } from '@nestjs/common';
import { InterfaceTrashRateReportRepository } from '../../../../domain/contracts/trash-rate-report.interface.repository';
import { DatabaseServiceSQLServer2022 } from '../../../../../../shared/connections/database/sqlserver/sqlserver-2022.service';
import {
  ClientTrashDetailRowModel,
  CollectorPerformanceKPIModel,
  CreditNoteRowModel,
  DailyCollectorDetailModel,
  MissingValorRowModel,
  MonthlySummaryRowModel,
  TopDebtorRowModel,
  TrashDashboardKpiModel,
  TrashRateAuditRowModel,
  TrashRateKPIModel,
} from '../../../../domain/models/trash-rate-report.model';
import {
  ClientTrashDetailRowSqlResult,
  CollectorPerformanceKPISqlResult,
  CreditNoteRowSqlResult,
  DailyCollectorDetailSqlResult,
  MissingValorRowSqlResult,
  MonthlySummaryRowSqlResult,
  TopDebtorRowSqlResult,
  TrashDashboardKpiSqlResult,
  TrashRateAuditRowSqlResult,
  TrashRateKPISqlResult,
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
      const safeOffset = Number.isInteger(offset) && offset! >= 0 ? offset! : 0;
      const safeLimit =
        Number.isInteger(limit) && limit! > 0 ? limit! : 1000000;
      const query = `
        SET NOCOUNT ON;
        DECLARE @fechaInicio DATETIME
        DECLARE @fechaFin DATETIME
        SET @fechaInicio = CONVERT(DATETIME, '${initDateTime}', 120)
        SET @fechaFin    = CONVERT(DATETIME, '${endDateTime}', 120)

        SELECT
            di.Cod_Ingreso                                          AS income_code,
            di.ClaveCatastral                                       AS cadastral_key,
            di.CodCliente_Ingreso                                   AS card_id,
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
        WHERE di.Fecha_Pago >= @fechaInicio
          AND di.Fecha_Pago <= @fechaFin
          AND di.tasa_basura IS NOT NULL
        ORDER BY di.ClaveCatastral ASC, di.Cod_Ingreso ASC
        OFFSET ${safeOffset} ROWS FETCH NEXT ${safeLimit} ROWS ONLY;
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
      const safeOffset = Number.isInteger(offset) && offset! >= 0 ? offset! : 0;
      const safeLimit =
        Number.isInteger(limit) && limit! > 0 ? limit! : 1000000;
      const query = `
        SET NOCOUNT ON;
        DECLARE @fechaInicio DATETIME
        SET @fechaInicio = CONVERT(DATETIME, '${initDateTime}', 120)
        SELECT
            nc.Cuenta                                               AS cadastral_key,
            nc.CedulaCiudadano                                      AS card_id,
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
            ia.total_trash_pendiente - SUM(COALESCE(nc.Valor, 0))    AS remaining_debt_after_nc
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
              AND Fecha_Pago >= @fechaInicio
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
        OFFSET ${safeOffset} ROWS FETCH NEXT ${safeLimit} ROWS ONLY;
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
          di.Cod_Ingreso                                          AS income_code,
          di.ClaveCatastral                                       AS cadastral_key,
          di.CodCliente_Ingreso                                   AS card_id,
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
          COALESCE(V.Valor, di.tasa_basura) - COALESCE(nc.Valor, 0)
                                                                  AS effective_trash_to_pay,
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
        AND di.Fecha_Pago >= '20260101'
      ORDER BY di.Fecha_Pago DESC;
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

            SUM(CASE WHEN V.cod_Ingreso IS NULL THEN 1 ELSE 0 END)  AS missing_valor_records,
            (SELECT COUNT(*) FROM AP_NotasCredito
            WHERE Cuenta IN (
                SELECT ClaveCatastral FROM Datos_ingreso
                WHERE Fecha_Pago >= @fechaInicioKPI AND Fecha_Pago <= @fechaFinKPI
            )) AS count_notes,

            (SELECT SUM(Valor) FROM AP_NotasCredito
            WHERE Cuenta IN (
                SELECT ClaveCatastral FROM Datos_ingreso
                WHERE Fecha_Pago >= @fechaInicioKPI AND Fecha_Pago <= @fechaFinKPI
            )) AS total_notes_amount

        FROM Datos_ingreso di
        LEFT JOIN dbo.Valor V
            ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = 10
        WHERE di.Fecha_Pago >= @fechaInicioKPI
          AND di.Fecha_Pago <= @fechaFinKPI
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
            di.Cod_Ingreso                                          AS income_code,
            di.ClaveCatastral                                       AS cadastral_key,
            di.CodCliente_Ingreso                                   AS card_id,
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
        WHERE di.Fecha_Pago >= @fechaInicio3
          AND di.Fecha_Pago <= @fechaFin3
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
        WHERE di.Fecha_Pago >= @fechaInicio2
          AND di.Fecha_Pago <= @fechaFin2
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
            di.CodCliente_Ingreso                                   AS card_id,
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
          AND di.Fecha_Pago >= @fechaInicioTop
          AND di.Fecha_Pago <= @fechaFinTop
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

  async getTrashRateKPI(
    startDate: string,
    endDate: string,
  ): Promise<TrashRateKPIModel[]> {
    try {
      const initDateTime = `${String(startDate)} 00:00:00.000`;
      const endDateTime = `${String(endDate)} 23:59:59.997`;
      const query = `
          -- 1. CONFIGURATION & PARAMETERS
          DECLARE @Date_Start     VARCHAR(50)
          DECLARE @Date_End       VARCHAR(50)
          DECLARE @Service_Order  INT
  
          SET @Date_Start    = CONVERT(VARCHAR(50), '${initDateTime}', 120)
          SET @Date_End      = CONVERT(VARCHAR(50), '${endDateTime}', 120)
SET @Service_Order = 10 -- Standard code for trash service in 'Valor' table

        -- 2. PRE-CALCULATION OF EXTERNAL METRICS
        DECLARE @Credit_Notes_Count  INT
        DECLARE @Credit_Notes_Total  DECIMAL(18,2)

        SELECT
            @Credit_Notes_Count = COUNT(*),
            @Credit_Notes_Total = SUM(Valor)
        FROM dbo.AP_NotasCredito
        WHERE Cuenta IN (
            SELECT ClaveCatastral
            FROM dbo.Datos_ingreso
            WHERE Fecha_Pago >= @Date_Start AND Fecha_Pago <= @Date_End
        );

        -- 3. MAIN KPI AGGREGATION
        SELECT
            -- Billing Metrics (Basadas en Fecha_Ingreso para no perder facturas pendientes)
            COUNT(di.Cod_Ingreso)                                   AS total_bills_issued,
            COUNT(DISTINCT di.ClaveCatastral)                       AS unique_cadastral_keys,

            -- Financial Totals & Integrity Audit
            SUM(di.tasa_basura)                                     AS source_trash_rate_total,
            SUM(V.Valor)                                            AS valor_table_total,
            SUM(COALESCE(V.Valor, 0) - COALESCE(di.tasa_basura, 0))  AS integrity_gap_amount,

            -- Todas las columnas originales corregidas:
            SUM(COALESCE(V.Valor, di.tasa_basura))                  AS gross_amount_to_collect,

            -- Este es el total emitido en el mes (cartera total generada)
            SUM(CASE
                    WHEN di.Fecha_Ingreso >= @Date_Start AND di.Fecha_Ingreso <= @Date_End
                        THEN COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)
                    ELSE 0
                END)                                                AS total_to_collected_monthly,

            -- Este es el monto real cobrado en el rango de fechas (Caja)
            SUM(CASE
                WHEN di.Fecha_Pago >= @Date_Start AND di.Fecha_Pago <= @Date_End
                    THEN COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)
                ELSE 0
            END)                                                    AS net_amount_collected,

            -- Facturas del mes que NO han sido pagadas en el rango
            SUM(CASE
                WHEN di.Fecha_Pago IS NULL OR di.Fecha_Pago > @Date_End
                    THEN COALESCE(V.Valor, di.tasa_basura)
                ELSE 0
            END)                                                    AS total_amount_pending,

            -- Compliance Metrics
            CASE
                WHEN SUM(COALESCE(V.Valor, di.tasa_basura)) = 0 THEN 0
                ELSE ROUND(
                    CAST(SUM(CASE
                        WHEN di.Fecha_Pago >= @Date_Start AND di.Fecha_Pago <= @Date_End
                            THEN COALESCE(V.Valor, di.tasa_basura)
                        ELSE 0
                    END) AS NUMERIC(18,4))
                    / SUM(COALESCE(V.Valor, di.tasa_basura)) * 100
                , 2)
            END                                                     AS collection_compliance_pct,

            -- Volume Counters
            SUM(CASE WHEN di.Fecha_Pago >= @Date_Start AND di.Fecha_Pago <= @Date_End THEN 1 ELSE 0 END) AS paid_bills_count,
            SUM(CASE WHEN di.Fecha_Pago IS NULL OR di.Fecha_Pago > @Date_End THEN 1 ELSE 0 END)          AS pending_bills_count,
            SUM(CASE WHEN V.cod_Ingreso IS NULL THEN 1 ELSE 0 END)     AS integrity_audit_missing_valor,

            -- Credit Notes
            COALESCE(@Credit_Notes_Count, 0)                        AS credit_notes_volume,
            COALESCE(@Credit_Notes_Total, 0)                        AS credit_notes_total_amount,

            -- New Enterprise KPI Percentages
            CASE
                WHEN COUNT(di.Cod_Ingreso) = 0 THEN 0
                ELSE ROUND(CAST(SUM(CASE WHEN di.Fecha_Pago >= @Date_Start AND di.Fecha_Pago <= @Date_End THEN 1 ELSE 0 END) AS NUMERIC(18,4)) / COUNT(di.Cod_Ingreso) * 100, 2)
            END AS payment_rate_volume_pct,

            CASE
                WHEN SUM(COALESCE(V.Valor, di.tasa_basura)) = 0 THEN 0
                ELSE ROUND(CAST(SUM(CASE WHEN di.Fecha_Pago IS NULL OR di.Fecha_Pago > @Date_End THEN COALESCE(V.Valor, di.tasa_basura) ELSE 0 END) AS NUMERIC(18,4)) / SUM(COALESCE(V.Valor, di.tasa_basura)) * 100, 2)
            END AS delinquency_rate_value_pct,

            CASE
                WHEN SUM(COALESCE(V.Valor, di.tasa_basura)) = 0 THEN 0
                ELSE ROUND(CAST(COALESCE(@Credit_Notes_Total, 0) AS NUMERIC(18,4)) / SUM(COALESCE(V.Valor, di.tasa_basura)) * 100, 2)
            END AS credit_notes_impact_pct

        INTO #MainKPIs
        FROM dbo.Datos_ingreso di
        LEFT JOIN dbo.Valor V
            ON di.Cod_Ingreso = V.cod_Ingreso
            AND V.orden = @Service_Order
        WHERE
            di.Fecha_Ingreso >= @Date_Start
          AND di.Fecha_Ingreso <= @Date_End
          AND di.tasa_basura IS NOT NULL;


        -- 4. DYNAMIC REVENUE DISTRIBUTION BY STATUS ARRAY (FILTRADO POR PAGO)
        SELECT
            COALESCE(di.Estado_Ingreso, 'Unknown') AS estado_ingreso,
            SUM(COALESCE(V.Valor, di.tasa_basura)) AS monto
        INTO #RevenueByStatus
        FROM dbo.Datos_ingreso di
        LEFT JOIN dbo.Valor V
            ON di.Cod_Ingreso = V.cod_Ingreso
            AND V.orden = @Service_Order
        WHERE
            di.Fecha_Pago >= @Date_Start
          AND di.Fecha_Pago <= @Date_End
          AND di.tasa_basura IS NOT NULL
        GROUP BY di.Estado_Ingreso;

        -- Build the JSON array string
        DECLARE @Dynamic_JSON_Array VARCHAR(8000)
        SET @Dynamic_JSON_Array = '['
        SELECT @Dynamic_JSON_Array = @Dynamic_JSON_Array +
            '{"Estado": "' + estado_ingreso + '", "Monto": ' + LTRIM(STR(monto, 18, 2)) + '}, '
        FROM #RevenueByStatus;

        IF LEN(@Dynamic_JSON_Array) > 1
            SET @Dynamic_JSON_Array = LEFT(@Dynamic_JSON_Array, LEN(@Dynamic_JSON_Array) - 1) + ']'
        ELSE
            SET @Dynamic_JSON_Array = '[]'

        -- 5. FINAL RESULT SET
        SELECT
            M.*,
            @Dynamic_JSON_Array AS revenue_status_json_array
        FROM #MainKPIs M;

        DROP TABLE #MainKPIs;
        DROP TABLE #RevenueByStatus;
        `;

      const result: TrashRateKPISqlResult[] =
        await this.sqlServerService.query<TrashRateKPISqlResult>(query);

      const response: TrashRateKPIModel[] = result.map((row) =>
        TrashRateReportAdapter.fromTrashRateKPISqlResultToTrashRateKPIModel(
          row,
        ),
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  async getCollectorPerformanceKPI(
    startDate: string,
    endDate: string,
  ): Promise<CollectorPerformanceKPIModel[]> {
    try {
      const initDateTime = `${String(startDate)} 00:00:00.000`;
      const endDateTime = `${String(endDate)} 23:59:59.997`;
      const query = `
          DECLARE @startDate VARCHAR(50)
          DECLARE @endDate VARCHAR(50)
          SET @startDate = CONVERT(DATETIME, '${initDateTime}', 120)
          SET @endDate    = CONVERT(DATETIME, '${endDateTime}', 120)
  
          -- 1. CONFIGURATION
          DECLARE @Service_Order  INT
  
          SET @Service_Order = 10
  
          -- 2. PRE-CALCULATION OF GLOBAL METRIC (For % Contribution)
          DECLARE @Global_Total_Collection DECIMAL(18,2)
  
          SELECT @Global_Total_Collection = SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0))
          FROM dbo.Datos_ingreso di
          LEFT JOIN dbo.Valor V ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = @Service_Order
          WHERE di.Fecha_Pago >= @startDate AND di.Fecha_Pago <= @endDate
            AND di.tasa_basura IS NOT NULL;
  
          -- Ensure no zero-division
          SET @Global_Total_Collection = CASE WHEN @Global_Total_Collection = 0 THEN 1 ELSE @Global_Total_Collection END;
  
          -- 3. PRODUCTIVITY AGGREGATION
          SELECT
              di.User_Cobro                                           AS collector_id,
  
              -- Volume Metrics
              COUNT(di.Cod_Ingreso)                                   AS total_transactions,
              COUNT(DISTINCT di.ClaveCatastral)                       AS unique_customers_served,
  
              -- Financial Performance & Integrity Audit
              SUM(di.tasa_basura)                                     AS source_trash_rate_total,
              SUM(V.Valor)                                            AS valor_table_total,
              SUM(COALESCE(V.Valor, 0) - COALESCE(di.tasa_basura, 0))  AS integrity_gap_amount,
  
              SUM(COALESCE(V.Valor, di.tasa_basura))                  AS gross_amount,
              SUM(COALESCE(di.descuento_tb, 0))                       AS total_discounts_applied,
  
              SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0))
                                                                      AS net_collection_total,
  
              -- Productivity KPIs
              ROUND(
                  (SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)) / COUNT(di.Cod_Ingreso))
              , 2)                                                    AS avg_ticket_size,
  
              ROUND(
                  (SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)) / @Global_Total_Collection) * 100
              , 2)                                                    AS pct_of_total_revenue,
  
              -- Error/Audit Metric
              SUM(CASE WHEN di.Estado_Ingreso = 'A' OR di.Estado_Ingreso = 'B' THEN 1 ELSE 0 END) AS cancelled_bills_count,
              -- Total value of cancelled bills could also be calculated if needed
              SUM(CASE WHEN di.Estado_Ingreso = 'A' OR di.Estado_Ingreso = 'B' THEN di.tasa_basura ELSE 0 END) AS cancelled_bills_value
  
          INTO #CollectorKPIs
          FROM dbo.Datos_ingreso di
          LEFT JOIN dbo.Valor V
              ON di.Cod_Ingreso = V.cod_Ingreso
              AND V.orden = @Service_Order
          WHERE
              di.Fecha_Pago >= @startDate
            AND di.Fecha_Pago <= @endDate
            AND di.tasa_basura IS NOT NULL
          GROUP BY di.User_Cobro;
  
          -- 4. FINAL RESULTS WITH RANKING (SQL 2000 Manual Rank)
          SELECT
              (SELECT COUNT(*) + 1
              FROM #CollectorKPIs C2
              WHERE C2.net_collection_total > C1.net_collection_total) AS performance_rank,
              C1.*
          FROM #CollectorKPIs C1
          ORDER BY performance_rank ASC;
  
          -- Cleanup
          DROP TABLE #CollectorKPIs;
        `;

      const result: CollectorPerformanceKPISqlResult[] =
        await this.sqlServerService.query<CollectorPerformanceKPISqlResult>(
          query,
        );

      const response: CollectorPerformanceKPIModel[] = result.map((row) =>
        TrashRateReportAdapter.fromCollectorPerformanceKPISqlResultToCollectorPerformanceKPIModel(
          row,
        ),
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  async getDailyCollectorDetail(
    startDate: string,
    endDate: string,
  ): Promise<DailyCollectorDetailModel[]> {
    try {
      const initDateTime = `${String(startDate)} 00:00:00.000`;
      const endDateTime = `${String(endDate)} 23:59:59.997`;
      const query = `
          DECLARE @startDate DATETIME
          DECLARE @endDate DATETIME
          SET @startDate = CONVERT(DATETIME, '${initDateTime}', 120)
          SET @endDate    = CONVERT(DATETIME, '${endDateTime}', 120)
  
          DECLARE @Service_Order INT
          SET @Service_Order = 10
  
          -- 2. DAILY AGGREGATION
          SELECT
              COALESCE(NULLIF(LTRIM(RTRIM(di.User_Cobro)), ''), 'sin_usuario') AS collector_id,
              di.Fecha_Pago                                           AS payment_date,
              di.Estado_Ingreso                                       AS income_status,
              -- Transaction Volume
              COUNT(di.Cod_Ingreso)                                   AS transactions_count,
  
              -- Financial Totals & Integrity Audit
              SUM(di.tasa_basura)                                     AS source_trash_rate_daily,
              SUM(V.Valor)                                            AS valor_table_daily,
              SUM(COALESCE(V.Valor, 0) - COALESCE(di.tasa_basura, 0))  AS integrity_gap_daily,
  
              SUM(COALESCE(V.Valor, di.tasa_basura))                  AS gross_daily_total,
              SUM(COALESCE(di.descuento_tb, 0))                       AS discounts_daily_total,
  
              SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0))
                                                                      AS net_daily_collection,
  
              -- Productivity KPIs per day
              ROUND(
                  (SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)) / CASE WHEN COUNT(di.Cod_Ingreso) = 0 THEN 1 ELSE COUNT(di.Cod_Ingreso) END)
              , 2)                                                    AS avg_ticket_daily,
  
              -- Audit Details
              SUM(CASE WHEN di.Estado_Ingreso = 'A' OR di.Estado_Ingreso = 'B' THEN 1 ELSE 0 END) AS cancelled_count_daily,
              -- Total value of cancelled bills could also be calculated if needed
              SUM(CASE WHEN di.Estado_Ingreso = 'A' OR di.Estado_Ingreso = 'B' THEN di.tasa_basura ELSE 0 END) AS cancelled_value_daily
  
          FROM dbo.Datos_ingreso di
          LEFT JOIN dbo.Valor V
              ON di.Cod_Ingreso = V.cod_Ingreso
              AND V.orden = @Service_Order
          WHERE
              di.Fecha_Pago >= @StartDate
            AND di.Fecha_Pago <= @EndDate
            AND di.tasa_basura IS NOT NULL
          GROUP BY COALESCE(NULLIF(LTRIM(RTRIM(di.User_Cobro)), ''), 'sin_usuario'), di.Fecha_Pago, di.Estado_Ingreso
          ORDER BY COALESCE(NULLIF(LTRIM(RTRIM(di.User_Cobro)), ''), 'sin_usuario') ASC, di.Fecha_Pago DESC;
        `;

      const result: DailyCollectorDetailSqlResult[] =
        await this.sqlServerService.query<DailyCollectorDetailSqlResult>(query);

      const response: DailyCollectorDetailModel[] = result.map((row) =>
        TrashRateReportAdapter.fromDailyCollectorDetailSqlResultToCollectorPerformanceKPIModel(
          row,
        ),
      );

      return response;
    } catch (error) {
      throw error;
    }
  }
}
