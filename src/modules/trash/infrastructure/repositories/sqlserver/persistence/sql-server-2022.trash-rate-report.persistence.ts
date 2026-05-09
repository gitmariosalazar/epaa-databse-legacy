import { Injectable } from '@nestjs/common';
import { InterfaceTrashRateReportRepository } from '../../../../domain/contracts/trash-rate-report.interface.repository';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
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
import { TrashRateAuditReportParams } from '../../../../domain/schemas/params/trash-rate-audit-report.params';

@Injectable()
export class SqlServer2022TrashRateReportPersistence
  implements InterfaceTrashRateReportRepository
{
  constructor(
    private readonly sqlServerService: DatabaseAbstract,
  ) {}

  async getTrashRateAuditReport(
    params: TrashRateAuditReportParams,
  ): Promise<TrashRateAuditRowModel[]> {
    try {
      const initDateTime = `${String(params.startDate)} 00:00:00.000`;
      const endDateTime = `${String(params.endDate)} 23:59:59.997`;
      const safeOffset =
        Number.isInteger(params.offset) && params.offset! >= 0
          ? params.offset!
          : 0;
      const safeLimit =
        Number.isInteger(params.limit) && params.limit! > 0
          ? params.limit!
          : 1000000;
      const pageSize = safeLimit;

      // --- Filtro de diagnóstico ---
      let extraFilter = '';
      if (params.diagnosticFilter === 'DIFFERENT_AND_NO_RECORD') {
        extraFilter = `
          AND (
            V.cod_Ingreso IS NULL
            OR ABS(ISNULL(di.tasa_basura, 0) - ISNULL(V.Valor, 0)) >= 0.01
          )`;
      }

      // --- queryDateFilter (solo aplica a Pagados y Todos) ---
      const queryDateFilter =
        params.dateFilter === 'incomeDate' ? 'Fecha_Ingreso' : 'Fecha_Pago';

      const monthsInMoraQueryColum =
        params.auditType === 'En Mora (Cartera Vencida)'
          ? `CASE WHEN di.Fecha_Venc_Interes < GETDATE() THEN DATEDIFF(MONTH, di.Fecha_Venc_Interes, GETDATE()) ELSE 0 END AS months_in_mora`
          : `0 AS months_in_mora`;

      const queryPaymentStatus =
        params.dateFilter === 'paymentDate'
          ? `AND di.Estado_Ingreso = 'P'`
          : '';

      // --- WHERE clause según auditType ---
      let dateFilter: string;
      switch (params.auditType) {
        // 1. Pagados — el usuario elige la columna de fecha
        case 'Pagados (Recaudados)':
          dateFilter = `
              WHERE di.${queryDateFilter} >= @fechaInicio
                AND di.${queryDateFilter} <= @fechaFin
                AND di.tasa_basura IS NOT NULL
                AND di.Estado_Ingreso = 'P'
                AND di.Fecha_Pago IS NOT NULL`;
          break;

        // 2. Cartera corriente — SIEMPRE Fecha_Ingreso
        case 'Pendientes (Cartera Corriente)':
          dateFilter = `
              WHERE di.Fecha_Ingreso >= @fechaInicio
                AND di.Fecha_Ingreso <= @fechaFin
                AND di.tasa_basura IS NOT NULL
                AND di.Fecha_Pago IS NULL
                AND di.Estado_Ingreso <> 'P'`;
          break;

        // 3. En mora — SIEMPRE Fecha_Ingreso + vencimiento ya superado
        case 'En Mora (Cartera Vencida)':
          dateFilter = `
              WHERE di.Fecha_Ingreso >= @fechaInicio
                AND di.Fecha_Ingreso <= @fechaFin
                AND di.tasa_basura IS NOT NULL
                AND di.Fecha_Pago IS NULL
                AND di.Estado_Ingreso <> 'P'
                AND di.Fecha_Venc_Interes < GETDATE()`;
          break;

        // 4. Todos — el usuario elige la columna de fecha
        case 'Todos (Pagados y Pendientes)':
          dateFilter = `
              WHERE di.${queryDateFilter} >= @fechaInicio
                AND di.${queryDateFilter} <= @fechaFin
                ${queryPaymentStatus}
                AND di.tasa_basura IS NOT NULL`;
          break;

        // Fallback seguro
        default:
          dateFilter = `
              WHERE di.${queryDateFilter} >= @fechaInicio
                AND di.${queryDateFilter} <= @fechaFin
                AND di.tasa_basura IS NOT NULL
                AND di.Estado_Ingreso = 'P'`;
      }

      const query = `
        SET NOCOUNT ON;
        DECLARE @fechaInicio DATETIME
        DECLARE @fechaFin DATETIME
        SET @fechaInicio = CONVERT(DATETIME, '${initDateTime}', 121)
        SET @fechaFin    = CONVERT(DATETIME, '${endDateTime}', 121)

        SELECT
            di.Cod_Ingreso                                          AS income_code,
            di.ClaveCatastral                                       AS cadastral_key,
            di.CodCliente_Ingreso                                   AS card_id,
            di.nombre                                               AS customer_name,
            CONVERT(VARCHAR(10), di.Fecha_Ingreso, 120)             AS issue_date,
            CONVERT(VARCHAR(10), di.Fecha_Pago, 120)                AS payment_date,
            di.Estado_Ingreso                                       AS payment_status_code,
            CASE
                WHEN di.Fecha_Pago IS NULL THEN 'PENDING'
                ELSE 'PAID'
            END                                                     AS payment_status,
            di.tasa_basura                                          AS rate_in_income,
            V.Valor                                                 AS rate_in_valor_table,
            di.descuento_tb                                         AS discount_applied,
            nc.Total_NC                                             AS credit_note_balance,
            ROUND(ISNULL(di.tasa_basura, 0) - ISNULL(V.Valor, 0), 2)
                                                                    AS difference,
            CASE
                WHEN V.cod_Ingreso IS NULL
                    THEN 'No record in Valor (Ord 10)'
                WHEN ABS(ISNULL(di.tasa_basura, 0) - ISNULL(V.Valor, 0)) < 0.01
                    THEN 'Correct Match'
                ELSE 'Different Value - Review'
            END                                                     AS diagnostic
        FROM Datos_ingreso di
        LEFT JOIN dbo.Valor V
            ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = 10
        OUTER APPLY (
            SELECT SUM(ISNULL(Valor, 0)) AS Total_NC
            FROM AP_NotasCredito
            WHERE Cuenta = di.ClaveCatastral
        ) nc
        ${dateFilter}
          ${extraFilter}
        ORDER BY di.ClaveCatastral ASC, di.Cod_Ingreso ASC
        OFFSET ${safeOffset} ROWS FETCH NEXT ${pageSize} ROWS ONLY;
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
      const pageSize = safeLimit;
      const totalRows = safeOffset + safeLimit;

      // SQL Server 2000 pagination: double TOP on the aggregated result
      const query = `
        SET NOCOUNT ON;
        DECLARE @fechaInicio DATETIME
        SET @fechaInicio = CONVERT(DATETIME, '${initDateTime}', 120)

        SELECT *
        FROM (
            SELECT TOP ${pageSize}
                p.cadastral_key,
                p.card_id,
                p.customer_name,
                p.total_trash_rate_history,
                p.last_bill_issued,
                p.last_payment_date,
                p.total_balance_in_favor,
                p.credit_note_count,
                p.observation,
                p.credit_coverage,
                p.pending_trash_debt,
                p.remaining_debt_after_nc
            FROM (
                SELECT TOP ${totalRows}
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
                      AND Cod_Titulo_Datos = 'AGP'
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
            ) p
            ORDER BY p.total_balance_in_favor ASC, p.cadastral_key DESC
        ) r
        ORDER BY r.total_balance_in_favor DESC, r.cadastral_key ASC;
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
          CONVERT(VARCHAR(10), di.Fecha_Ingreso, 120)             AS issue_date,
          CONVERT(VARCHAR(10), di.Fecha_Venc_Interes, 120)        AS due_date,
          CONVERT(VARCHAR(10), di.Fecha_Pago, 120)                AS payment_date,
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
        AND di.Cod_Titulo_Datos = 'AGP'
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
            -- 1. Universo de emisión: TODAS las facturas emitidas en el período
            COUNT(di.Cod_Ingreso)                                   AS total_bills_issued,

            -- Monto total a cobrar (emitido en el período)
            SUM(COALESCE(V.Valor, di.tasa_basura))                  AS total_to_collect,

            -- Monto ya cobrado (de las emitidas en el período que tienen Fecha_Pago)
            SUM(CASE
                WHEN di.Fecha_Pago IS NOT NULL
                    THEN COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)
                ELSE 0
            END)                                                    AS total_collected,

            -- Descuentos aplicados solo a las que ya tienen pago
            SUM(CASE
                WHEN di.Fecha_Pago IS NOT NULL
                    THEN COALESCE(di.descuento_tb, 0)
                ELSE 0
            END)                                                    AS total_discounts,

            -- Monto pendiente de cobro (emitidas en el período sin Fecha_Pago)
            SUM(CASE
                WHEN di.Fecha_Pago IS NULL
                    THEN COALESCE(V.Valor, di.tasa_basura)
                ELSE 0
            END)                                                    AS total_pending,

            -- % cumplimiento: cobrado (neto) / total_emitido * 100
            CASE
                WHEN SUM(COALESCE(V.Valor, di.tasa_basura)) = 0 THEN 0
                ELSE ROUND(
                    CAST(SUM(CASE
                        WHEN di.Fecha_Pago IS NOT NULL
                            THEN COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)
                        ELSE 0
                    END) AS NUMERIC(18,4))
                    / SUM(COALESCE(V.Valor, di.tasa_basura)) * 100
                , 1)
            END                                                     AS compliance_pct,

            COUNT(DISTINCT di.ClaveCatastral)                       AS unique_cadastral_keys,

            -- Facturas pagadas (con Fecha_Pago) del lote emitido en el período
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END)
                                                                    AS paid_bills,

            -- Facturas aún pendientes (sin Fecha_Pago) del lote emitido en el período
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS pending_bills,

            SUM(CASE WHEN V.cod_Ingreso IS NULL THEN 1 ELSE 0 END)  AS missing_valor_records,

            -- Notas de crédito activas de clientes con facturas emitidas en el período
            (SELECT COUNT(*) FROM AP_NotasCredito
            WHERE Cuenta IN (
                SELECT ClaveCatastral FROM Datos_ingreso
                WHERE Fecha_Ingreso >= @fechaInicioKPI AND Fecha_Ingreso <= @fechaFinKPI
                  AND tasa_basura IS NOT NULL
                  AND Cod_Titulo_Datos = 'AGP'
            )) AS count_notes,

            (SELECT SUM(Valor) FROM AP_NotasCredito
            WHERE Cuenta IN (
                SELECT ClaveCatastral FROM Datos_ingreso
                WHERE Fecha_Ingreso >= @fechaInicioKPI AND Fecha_Ingreso <= @fechaFinKPI
                  AND tasa_basura IS NOT NULL
                  AND Cod_Titulo_Datos = 'AGP'
            )) AS total_notes_amount

        FROM Datos_ingreso di
        LEFT JOIN dbo.Valor V
            ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = 10
        -- Universo correcto: facturas EMITIDAS en el período
        WHERE di.Fecha_Ingreso >= @fechaInicioKPI
          AND di.Fecha_Ingreso <= @fechaFinKPI
          AND di.tasa_basura IS NOT NULL
          AND di.Cod_Titulo_Datos = 'AGP';
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
        DECLARE @Date_Start DATETIME
        DECLARE @Date_End   DATETIME
        DECLARE @Service_Order INT

        SET @Date_Start = CONVERT(DATETIME, '${initDateTime}', 120)
        SET @Date_End   = CONVERT(DATETIME, '${endDateTime}', 120)
        SET @Service_Order = 10 

        SELECT
            di.Cod_Ingreso                                          AS income_code,
            di.ClaveCatastral                                       AS cadastral_key,
            di.CodCliente_Ingreso                                   AS card_id,
            di.Cod_Titulo_Datos                                     AS data_title_code,
            di.nombre                                               AS customer_name,
            CONVERT(VARCHAR(10), di.Fecha_Ingreso, 120)             AS issue_date,
            CONVERT(VARCHAR(10), di.Fecha_Pago, 120)                AS payment_date,
            di.tasa_basura                                          AS trash_rate,
            di.Estado_Ingreso                                       AS payment_status_code,
            CASE
                WHEN di.Fecha_Pago IS NULL THEN 'PENDING'
                ELSE 'PAID'
            END                                                     AS payment_status,
            V.orden                                                 AS valor_order,
            di.tasa_basura                                          AS rate_in_income,
            V.Valor                                                 AS rate_in_valor_table,
            (ISNULL(di.tasa_basura, 0) - ISNULL(V.Valor, 0))        AS integrity_gap_indivual,
            CASE
                WHEN di.tasa_basura IS NULL THEN 'CRITICAL: Trash rate NOT ADDED to this bill'
                WHEN V.cod_Ingreso IS NULL THEN 'MISSING: No record in Valor Table (Orden 10)'
                WHEN ABS(ISNULL(di.tasa_basura, 0) - ISNULL(V.Valor, 0)) > 0.01 THEN 'DISCREPANCY: Different amount charged'
                ELSE 'OK'
            END AS final_diagnosis
        FROM Datos_ingreso di
        LEFT JOIN dbo.Valor V
            ON di.Cod_Ingreso = V.cod_Ingreso
            AND V.orden = @Service_Order
        WHERE (
              (di.Fecha_Ingreso >= @Date_Start AND di.Fecha_Ingreso <= @Date_End)
          )
          AND (
              V.cod_Ingreso IS NULL
              OR di.tasa_basura IS NULL
              OR ABS(ISNULL(di.tasa_basura, 0) - ISNULL(V.Valor, 0)) > 0.01
          )
        AND di.ClaveCatastral <> '0'
        AND di.Cod_Titulo_Datos = 'AGP'
        ORDER BY integrity_gap_indivual DESC;
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
          AND di.Cod_Titulo_Datos = 'AGP'
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
          AND di.Fecha_Ingreso >= @fechaInicioTop
          AND di.Fecha_Ingreso <= @fechaFinTop
          AND di.Cod_Titulo_Datos = 'AGP'
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
      const initDateTime = `${startDate.trim()} 00:00:00.000`;
      const endDateTime = `${endDate.trim()} 23:59:59.997`;

      const query = `
      -- 1. SETUP PARAMETERS
      DECLARE @Date_Start  DATETIME = CONVERT(DATETIME, '${initDateTime}', 120);
      DECLARE @Date_End    DATETIME = CONVERT(DATETIME, '${endDateTime}', 120);
      DECLARE @Service_Order INT = 10;

      -- 2. STATUS BREAKDOWN JSON HELPERS
      -- Helper 1: Globales
      DECLARE @JSON_Global NVARCHAR(MAX) = N'[';
      SELECT @JSON_Global += 
          N'{"Estado":"' + REPLACE(COALESCE(di.Estado_Ingreso, 'S/E'), '"', '""') + N'", "Monto":' + 
          REPLACE(LTRIM(RTRIM(STR(SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)), 18, 2))), ',', '.') + N'},'
      FROM dbo.Datos_ingreso di
      LEFT JOIN dbo.Valor V ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = @Service_Order
      WHERE di.Fecha_Ingreso >= @Date_Start AND di.Fecha_Ingreso <= @Date_End
        AND di.tasa_basura IS NOT NULL
        AND di.Cod_Titulo_Datos = 'AGP'
      GROUP BY di.Estado_Ingreso;
      SET @JSON_Global = CASE WHEN LEN(@JSON_Global) > 1 THEN LEFT(@JSON_Global, LEN(@JSON_Global) - 1) + N']' ELSE N'[]' END;

      -- Helper 2: Recaudación
      DECLARE @JSON_Revenue NVARCHAR(MAX) = N'[';
      SELECT @JSON_Revenue += 
          N'{"Estado":"' + REPLACE(COALESCE(di.Estado_Ingreso, 'S/E'), '"', '""') + N'", "Monto":' + 
          REPLACE(LTRIM(RTRIM(STR(SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)), 18, 2))), ',', '.') + N'},'
      FROM dbo.Datos_ingreso di
      LEFT JOIN dbo.Valor V ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = @Service_Order
      WHERE di.Fecha_Pago >= @Date_Start AND di.Fecha_Pago <= @Date_End
        AND di.tasa_basura IS NOT NULL
        AND di.Estado_Ingreso = 'P'
        AND di.Cod_Titulo_Datos = 'AGP'
      GROUP BY di.Estado_Ingreso;
      SET @JSON_Revenue = CASE WHEN LEN(@JSON_Revenue) > 1 THEN LEFT(@JSON_Revenue, LEN(@JSON_Revenue) - 1) + N']' ELSE N'[]' END;

      -- Helper 3: Cumplimiento
      DECLARE @JSON_Compliance NVARCHAR(MAX) = N'[';
      SELECT @JSON_Compliance += 
          N'{"Estado":"' + REPLACE(COALESCE(di.Estado_Ingreso, 'S/E'), '"', '""') + N'", "Monto":' + 
          REPLACE(LTRIM(RTRIM(STR(SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)), 18, 2))), ',', '.') + N'},'
      FROM dbo.Datos_ingreso di
      LEFT JOIN dbo.Valor V ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = @Service_Order
      WHERE di.Fecha_Ingreso >= @Date_Start AND di.Fecha_Ingreso <= @Date_End
        AND di.Fecha_Pago >= @Date_Start AND di.Fecha_Pago <= @Date_End
        AND di.tasa_basura IS NOT NULL
        AND di.Estado_Ingreso = 'P'
        AND di.Cod_Titulo_Datos = 'AGP'
      GROUP BY di.Estado_Ingreso;
      SET @JSON_Compliance = CASE WHEN LEN(@JSON_Compliance) > 1 THEN LEFT(@JSON_Compliance, LEN(@JSON_Compliance) - 1) + N']' ELSE N'[]' END;

      -- 3. MAIN CATEGORIES (UNION ALL)
      -- CATEGORY 1: Globales (Emitidos) por fecha de emisión no se toma en cuenta la fecha de pago
      SELECT 
          'Globales (Emitidos Fecha Emisión ${startDate} - ${endDate})' AS category_name,
          COUNT(di.Cod_Ingreso) AS total_bills,
          COUNT(DISTINCT di.ClaveCatastral) AS unique_cadastral_keys,
          SUM(di.tasa_basura) AS source_trash_rate,
          SUM(COALESCE(V.Valor, di.tasa_basura)) AS valor_table_amount,
          SUM(COALESCE(di.tasa_basura, 0) - COALESCE(V.Valor, 0)) AS integrity_gap,
          SUM(COALESCE(V.Valor, di.tasa_basura)) AS gross_amount,
          SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)) AS net_amount,
          SUM(COALESCE(di.descuento_tb, 0)) AS discounts,
          SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END) AS paid_bills,
          SUM(CASE WHEN di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS pending_bills,
          CASE WHEN SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)) = 0 THEN 0
                ELSE ROUND(CAST(SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0) ELSE 0 END) AS NUMERIC(18,4)) 
                    / NULLIF(SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)), 0) * 100, 2)
          END AS collection_rate,
          (SELECT COUNT(*) FROM dbo.AP_NotasCredito nc 
           WHERE EXISTS (SELECT 1 FROM dbo.Datos_ingreso di2 WHERE di2.ClaveCatastral = nc.Cuenta 
                         AND di2.Fecha_Ingreso >= @Date_Start AND di2.Fecha_Ingreso <= @Date_End AND di2.tasa_basura IS NOT NULL)) AS credit_notes_volume,
          (SELECT SUM(ISNULL(nc.Valor, 0)) FROM dbo.AP_NotasCredito nc 
           WHERE EXISTS (SELECT 1 FROM dbo.Datos_ingreso di2 WHERE di2.ClaveCatastral = nc.Cuenta 
                         AND di2.Fecha_Ingreso >= @Date_Start AND di2.Fecha_Ingreso <= @Date_End AND di2.tasa_basura IS NOT NULL)) AS credit_notes_amount,
          @JSON_Global AS revenue_status_json
      FROM dbo.Datos_ingreso di
      LEFT JOIN dbo.Valor V ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = @Service_Order
      WHERE di.Fecha_Ingreso >= @Date_Start AND di.Fecha_Ingreso <= @Date_End
        AND di.tasa_basura IS NOT NULL
        AND di.Cod_Titulo_Datos = 'AGP'

      UNION ALL

      -- CATEGORY 2: Recaudación (Pagados en Período por fecha de pago) no se toma en cuenta la fecha de emisión
      SELECT 
          'Recaudación (Pagados Fecha Pago ${startDate} - ${endDate})' AS category_name,
          COUNT(di.Cod_Ingreso) AS total_bills,
          COUNT(DISTINCT di.ClaveCatastral) AS unique_cadastral_keys,
          SUM(di.tasa_basura) AS source_trash_rate,
          SUM(COALESCE(V.Valor, di.tasa_basura)) AS valor_table_amount,
          SUM(COALESCE(di.tasa_basura, 0) - COALESCE(V.Valor, 0)) AS integrity_gap,
          SUM(COALESCE(V.Valor, di.tasa_basura)) AS gross_amount,
          SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)) AS net_amount,
          SUM(COALESCE(di.descuento_tb, 0)) AS discounts,
          SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END) AS paid_bills,
          SUM(CASE WHEN di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS pending_bills,
          CASE WHEN SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)) = 0 THEN 0
                ELSE ROUND(CAST(SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0) ELSE 0 END) AS NUMERIC(18,4)) 
                    / NULLIF(SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)), 0) * 100, 2)
          END AS collection_rate,
          (SELECT COUNT(*) FROM dbo.AP_NotasCredito nc 
           WHERE EXISTS (SELECT 1 FROM dbo.Datos_ingreso di2 WHERE di2.ClaveCatastral = nc.Cuenta 
                         AND di2.Fecha_Pago >= @Date_Start AND di2.Fecha_Pago <= @Date_End AND di2.tasa_basura IS NOT NULL AND di2.Estado_Ingreso = 'P')) AS credit_notes_volume,
          (SELECT SUM(ISNULL(nc.Valor, 0)) FROM dbo.AP_NotasCredito nc 
           WHERE EXISTS (SELECT 1 FROM dbo.Datos_ingreso di2 WHERE di2.ClaveCatastral = nc.Cuenta 
                         AND di2.Fecha_Pago >= @Date_Start AND di2.Fecha_Pago <= @Date_End AND di2.tasa_basura IS NOT NULL AND di2.Estado_Ingreso = 'P')) AS credit_notes_amount,
          @JSON_Revenue AS revenue_status_json
      FROM dbo.Datos_ingreso di
      LEFT JOIN dbo.Valor V ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = @Service_Order
      WHERE di.Fecha_Pago >= @Date_Start AND di.Fecha_Pago <= @Date_End
        AND di.tasa_basura IS NOT NULL
        AND di.Estado_Ingreso = 'P'
        AND di.Cod_Titulo_Datos = 'AGP'

      UNION ALL

      -- CATEGORY 3: Cumplimiento (Emitidos y Pagados en Período por fecha de pago y emisión) 
      -- Se toma en cuenta la fecha de pago y la fecha de emisión, el resultado debe ser todas las facturas que fueron emitidas en el período y pagadas en el período
      SELECT 
          'Cumplimiento (Emitidos y Pagados Fecha Emisión y Pago ${startDate} - ${endDate})' AS category_name,
          COUNT(di.Cod_Ingreso) AS total_bills,
          COUNT(DISTINCT di.ClaveCatastral) AS unique_cadastral_keys,
          SUM(di.tasa_basura) AS source_trash_rate,
          SUM(COALESCE(V.Valor, di.tasa_basura)) AS valor_table_amount,
          SUM(COALESCE(di.tasa_basura, 0) - COALESCE(V.Valor, 0)) AS integrity_gap,
          SUM(COALESCE(V.Valor, di.tasa_basura)) AS gross_amount,
          SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)) AS net_amount,
          SUM(COALESCE(di.descuento_tb, 0)) AS discounts,
          SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END) AS paid_bills,
          SUM(CASE WHEN di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS pending_bills,
          CASE WHEN SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)) = 0 THEN 0
                ELSE ROUND(CAST(SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0) ELSE 0 END) AS NUMERIC(18,4)) 
                    / NULLIF(SUM(COALESCE(V.Valor, di.tasa_basura) - COALESCE(di.descuento_tb, 0)), 0) * 100, 2)
          END AS collection_rate,
          (SELECT COUNT(*) FROM dbo.AP_NotasCredito nc 
           WHERE EXISTS (SELECT 1 FROM dbo.Datos_ingreso di2 WHERE di2.ClaveCatastral = nc.Cuenta 
                         AND di2.Fecha_Ingreso >= @Date_Start AND di2.Fecha_Ingreso <= @Date_End 
                         AND di2.Fecha_Pago >= @Date_Start AND di2.Fecha_Pago <= @Date_End AND di2.tasa_basura IS NOT NULL AND di2.Estado_Ingreso = 'P')) AS credit_notes_volume,
          (SELECT SUM(ISNULL(nc.Valor, 0)) FROM dbo.AP_NotasCredito nc 
           WHERE EXISTS (SELECT 1 FROM dbo.Datos_ingreso di2 WHERE di2.ClaveCatastral = nc.Cuenta 
                         AND di2.Fecha_Ingreso >= @Date_Start AND di2.Fecha_Ingreso <= @Date_End 
                         AND di2.Fecha_Pago >= @Date_Start AND di2.Fecha_Pago <= @Date_End AND di2.tasa_basura IS NOT NULL AND di2.Estado_Ingreso = 'P')) AS credit_notes_amount,
          @JSON_Compliance AS revenue_status_json
      FROM dbo.Datos_ingreso di
      LEFT JOIN dbo.Valor V ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = @Service_Order
      WHERE di.Fecha_Ingreso >= @Date_Start AND di.Fecha_Ingreso <= @Date_End
        AND di.Fecha_Pago >= @Date_Start AND di.Fecha_Pago <= @Date_End
        AND di.tasa_basura IS NOT NULL
        AND di.Estado_Ingreso = 'P'
        AND di.Cod_Titulo_Datos = 'AGP';
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
      console.error('Error al obtener KPI tasa de basura:', error);
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
            AND di.tasa_basura IS NOT NULL
            AND di.Cod_Titulo_Datos = 'AGP';
  
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
              SUM(COALESCE(di.tasa_basura, 0) - COALESCE(V.Valor, 0))  AS integrity_gap_amount,
  
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
          WHERE di.Fecha_Pago >= @startDate
            AND di.Fecha_Pago <= @endDate
            AND di.tasa_basura IS NOT NULL
            AND di.Estado_Ingreso = 'P'
            AND di.Cod_Titulo_Datos = 'AGP'
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
            COALESCE(NULLIF(LTRIM(RTRIM(di.User_Cobro)), ''), 'sin_usuario')  AS collector_id,
            di.Fecha_Pago                                           AS payment_date,
            di.Estado_Ingreso                                       AS income_status,
            -- Transaction Volume
            COUNT(di.Cod_Ingreso)                                   AS transactions_count,

            -- Financial Totals & Integrity Audit
            SUM(di.tasa_basura)                                     AS source_trash_rate_daily,
            SUM(V.Valor)                                            AS valor_table_daily,
            SUM(COALESCE(di.tasa_basura, 0) - COALESCE(V.Valor, 0))  AS integrity_gap_daily,

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
            -- Total value of cancelled bills (if any)
            SUM(CASE WHEN di.Estado_Ingreso = 'A' OR di.Estado_Ingreso = 'B' THEN COALESCE(V.Valor, di.tasa_basura) ELSE 0 END) AS cancelled_value_daily

        FROM dbo.Datos_ingreso di
        LEFT JOIN dbo.Valor V
            ON di.Cod_Ingreso = V.cod_Ingreso
            AND V.orden = @Service_Order
        WHERE di.Fecha_Pago >= @startDate
          AND di.Fecha_Pago <= @endDate
          AND di.tasa_basura IS NOT NULL
          AND di.Cod_Titulo_Datos = 'AGP'
        GROUP BY COALESCE(NULLIF(LTRIM(RTRIM(di.User_Cobro)), ''), 'sin_usuario'), di.Fecha_Pago, di.Estado_Ingreso
        ORDER BY COALESCE(NULLIF(LTRIM(RTRIM(di.User_Cobro)), ''), 'sin_usuario') ASC, di.Fecha_Pago DESC;
      `;

      const result: DailyCollectorDetailSqlResult[] =
        await this.sqlServerService.query<DailyCollectorDetailSqlResult>(query);

      const response: DailyCollectorDetailModel[] = result.map((row) =>
        TrashRateReportAdapter.fromDailyCollectorDetailSqlResultToDailyCollectorDetailModel(
          row,
        ),
      );

      return response;
    } catch (error) {
      throw error;
    }
  }
}
