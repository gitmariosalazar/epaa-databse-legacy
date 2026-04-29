import { Injectable } from '@nestjs/common';
import { DatabaseServiceSQLServer2000 } from '../../../../../../shared/connections/database/sqlserver/sqlserver-2000.service';
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
export class SQLServer2000AccountingPersistence
  implements InterfaceAccountingRepository
{
  constructor(
    private readonly sqlServerService: DatabaseServiceSQLServer2000,
  ) {}

  async findAllPaymentByDateAndOrderValue(
    paymentDate: string,
    orderValue: number,
  ): Promise<PaymentResponse[]> {
    try {
      const query: string = `
        SET NOCOUNT ON;
        SET ANSI_WARNINGS OFF;
          SELECT TOP 1500
            di.Cod_Ingreso AS income_code,
            di.CodCliente_Ingreso AS card_id,
            di.nombre AS name,
            di.Fecha_Ingreso AS income_date,
            di.Fecha_Pago AS payment_date,
            di.Estado_Ingreso AS income_status,
            di.Cod_Titulo_Datos AS title_code,
            di.Fecha_Venc_Interes AS due_date,
            di.Valor_Titulo AS title_value,
            di.ValorTerceros AS third_party_value,
            di.Recargo AS surcharge,
            di.tasa_basura AS trash_rate,
            di.ClaveCatastral AS cadastral_key,
            (COALESCE(di.Valor_Titulo,0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.tasa_basura, 0)) AS total,
            di.User_Cobro AS payment_user,
            v.Valor AS value,
            v.orden AS order_value,
            di.FormaDePago AS payment_method,
            di.Comentario AS comment
          FROM Datos_ingreso di
              INNER JOIN Valor V ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = ${orderValue}
          WHERE di.Fecha_Pago >= CONVERT(DATETIME, '${String(paymentDate)} 00:00:00.000', 120)
            AND di.Fecha_Pago <= CONVERT(DATETIME, '${String(paymentDate)} 23:59:59.997', 120)
            AND v.orden = ${orderValue}
          ORDER BY di.Fecha_Ingreso DESC;
      `;
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
      const query: string = `
      SET NOCOUNT ON;
      SET ANSI_WARNINGS OFF;
      SELECT TOP 1500
          di.Cod_Ingreso                  AS income_code,
          c.CED_IDENT_CIUDADANO           AS card_id,
          c.NOMBRES_CIUDADANO             AS name,
          c.APELLIDOS_CIUDADANO           AS last_name,
          di.ClaveCatastral               AS cadastral_key,
          di.Direccion                    AS address,
          a.Tarifa                        AS rate,
          l.Mes                           AS month,
          l.Anio                          AS year,
          l.LecturaActual                 AS current_reading,
          l.LecturaAnterior               AS previous_reading,
          l.ValorAPagar                   AS reading_value,
          di.User_Cobro                   AS payment_user,
          di.Cod_Titulo_Datos             AS title_code,
          di.Recargo                      AS surcharge,
          CASE
              WHEN l.LecturaActual IS NOT NULL
              THEN (l.LecturaActual - l.LecturaAnterior)
              ELSE NULL
          END                             AS consumption,

          CASE
              WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
              WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE()
                  THEN 'Pendiente de lectura (período actual/futuro)'
              WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE()
                  THEN 'Lectura no registrada o pendiente'
              ELSE 'No disponible'
          END                             AS reading_status,

          di.Fecha_Pago                   AS payment_date,

          CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura      ELSE NULL END AS trash_rate,
          CASE WHEN l.LecturaActual IS NOT NULL THEN (di.Valor_Titulo + di.Recargo)   ELSE NULL END AS epaa_value,
          CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros    ELSE NULL END AS third_party_value,

          CASE WHEN l.LecturaActual IS NOT NULL
              THEN COALESCE(di.Valor_Titulo, 0) +
                    COALESCE(di.ValorTerceros, 0) +
                    COALESCE(di.tasa_basura, 0) + COALESCE(di.Recargo, 0)
              ELSE NULL
          END                             AS total,

          di.Fecha_Venc_Interes           AS due_date,
          di.Estado_Ingreso               AS income_status,
          di.Fecha_Ingreso                AS income_date,
          v.Valor                         AS value,
          v.orden                         AS order_value,
          di.FormaDePago                  AS payment_method,
          di.Comentario                   AS comment

      FROM Datos_ingreso di
      INNER JOIN CIUDADANO c
          ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

      INNER JOIN AP_ACOMETIDAS a
          ON a.Sector =
              CASE
                  WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                      AND ISNUMERIC(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) = 1
                      AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) <= 2
                  THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                  ELSE -1
              END
          AND a.Cuenta =
              CASE
                  WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                      AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1
                  THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))
                  ELSE -1
              END

      LEFT JOIN AP_LECTURAS l
          ON l.ClaveCatastral = di.ClaveCatastral
          AND l.Anio = YEAR(DATEADD(month, -1, di.Fecha_Venc_Interes))
          AND UPPER(LTRIM(RTRIM(l.Mes))) = UPPER(
              CASE MONTH(DATEADD(month, -1, di.Fecha_Venc_Interes))
                  WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                  WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                  WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                  WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
              END
          )
      INNER JOIN dbo.Valor V ON di.Cod_Ingreso = V.cod_Ingreso AND v.orden = 10
      WHERE
          di.Fecha_Pago >= CONVERT(DATETIME, '${String(paymentDate)} 00:00:00.000', 120)
          AND di.Fecha_Pago <= CONVERT(DATETIME, '${String(paymentDate)} 23:59:59.997', 120)

      ORDER BY
          di.ClaveCatastral,
          di.Fecha_Ingreso DESC;
      `;
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
      const query: string = `
        SET NOCOUNT ON
            SELECT
              di.Cod_Ingreso AS income_code,
              di.CodCliente_Ingreso AS card_id,
              di.nombre AS name,
              di.Fecha_Ingreso AS income_date,
              di.Fecha_Pago AS payment_date,
              di.Estado_Ingreso AS income_status,
              di.Cod_Titulo_Datos AS title_code,
              di.Fecha_Venc_Interes AS due_date,
              di.Valor_Titulo AS title_value,
              di.ValorTerceros AS third_party_value,
              di.Recargo AS surcharge,
              di.tasa_basura AS trash_rate,
              di.ClaveCatastral AS cadastral_key,
              di.FormaDePago AS payment_method,
              di.Comentario AS comment,
              (COALESCE(di.Valor_Titulo,0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.tasa_basura, 0)) AS total,
              di.User_Cobro AS payment_user,
              SUM(v.Valor) AS value
            FROM Datos_ingreso di
                INNER JOIN Valor V ON di.Cod_Ingreso = V.cod_Ingreso
            WHERE di.Fecha_Pago >= CONVERT(DATETIME, '${String(paymentDate)} 00:00:00.000', 120)
              AND di.Fecha_Pago <= CONVERT(DATETIME, '${String(paymentDate)} 23:59:59.997', 120)
            GROUP BY
              di.Cod_Ingreso, di.CodCliente_Ingreso, di.nombre, di.Fecha_Ingreso, di.Fecha_Pago,
              di.Estado_Ingreso, di.Cod_Titulo_Datos, di.Fecha_Venc_Interes, di.Valor_Titulo,
              di.ValorTerceros, di.Recargo, di.tasa_basura, di.ClaveCatastral,
              di.FormaDePago, di.Comentario, di.User_Cobro
            ORDER BY di.Fecha_Ingreso DESC;
        `;
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

      const query: string = `
        SET NOCOUNT ON

        SELECT TOP ${safeLimit}
          di.Cod_Ingreso AS income_code,
          di.CodCliente_Ingreso AS card_id,
          di.nombre AS name,
          di.Fecha_Ingreso AS income_date,
          di.Fecha_Pago AS payment_date,
          di.Estado_Ingreso AS income_status,
          di.Cod_Titulo_Datos AS title_code,
          di.Fecha_Venc_Interes AS due_date,
          di.Valor_Titulo AS title_value,
          di.ValorTerceros AS third_party_value,
          di.Recargo AS surcharge,
          di.tasa_basura AS trash_rate,
          di.ClaveCatastral AS cadastral_key,
          di.FormaDePago AS payment_method,
          di.Comentario AS comment,
          (COALESCE(di.Valor_Titulo,0) + COALESCE(di.ValorTerceros,0) +
           COALESCE(di.Recargo,0) + COALESCE(di.tasa_basura,0)) AS total,
          di.User_Cobro AS payment_user,
          SUM(v.Valor) AS value
        FROM Datos_ingreso di
        INNER JOIN Valor v ON di.Cod_Ingreso = v.cod_Ingreso
        WHERE di.Fecha_Pago >= CONVERT(DATETIME, '${initDateTime}', 120)
          AND di.Fecha_Pago <= CONVERT(DATETIME, '${endDateTime}', 120)
          ${offsetClause}
        GROUP BY
          di.Cod_Ingreso, di.CodCliente_Ingreso, di.nombre, di.Fecha_Ingreso, di.Fecha_Pago,
          di.Estado_Ingreso, di.Cod_Titulo_Datos, di.Fecha_Venc_Interes, di.Valor_Titulo,
          di.ValorTerceros, di.Recargo, di.tasa_basura, di.ClaveCatastral,
          di.FormaDePago, di.Comentario, di.User_Cobro
        ORDER BY di.Fecha_Ingreso DESC;
        `;
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

      const query: string = `
      SET NOCOUNT ON;

      SELECT 
        IDENTITY(int, 1, 1) AS rn,
        di.ClaveCatastral AS cadastral_key,
        di.CodCliente_Ingreso AS client_id,
        MAX(di.nombre) AS name,
        SUM(COALESCE(di.tasa_basura, 0))          AS total_trash_rate,
        SUM(COALESCE(di.Valor_Titulo, 0))         AS total_epaa_value,
        SUM(COALESCE(di.interes_mejoras, 0))      AS total_old_improvements_interest,
        SUM(COALESCE(di.Recargo, 0))              AS total_surcharge,
        SUM(COALESCE(di.Recargo_old, 0))          AS total_old_surcharge,
        COUNT(di.Cod_Ingreso)                     AS months_past_due
      INTO #OverdueTemp
      FROM Datos_ingreso di
      WHERE di.Fecha_Pago IS NULL
        AND di.Estado_Ingreso IS NULL
        AND di.convenio IS NULL

      GROUP BY di.ClaveCatastral, di.CodCliente_Ingreso
      HAVING COUNT(di.Cod_Ingreso) > 1;

      SELECT TOP ${safeLimit}
        cadastral_key,
        client_id,
        name,
        total_trash_rate,
        total_epaa_value,
        total_old_improvements_interest,
        total_surcharge,
        total_old_surcharge,
        months_past_due
      FROM #OverdueTemp
      WHERE rn > ${safeOffset}
      ORDER BY rn;

      DROP TABLE #OverdueTemp;
    `;

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
      const query: string = `
        SET NOCOUNT ON;

        DECLARE @Corte DATETIME;
        SET @Corte = GETDATE();

        SELECT
            COUNT(DISTINCT CodCliente_Ingreso) AS total_clients_with_debt,
            COUNT(DISTINCT ClaveCatastral)     AS total_unique_cadastral_keys,

            SUM(months_past_due)               AS total_months_past_due,
            SUM(total_debt_amount)             AS total_debt_amount,

            SUM(total_epaa_value)              AS total_epaa_value,
            SUM(total_trash_rate)              AS total_trash_rate,
            SUM(total_surcharge)               AS total_surcharge,
            SUM(total_old_surcharge)           AS total_old_surcharge,
            SUM(total_improvements_interest)   AS total_improvements_interest,

            AVG(CAST(months_past_due AS DECIMAL(10,2))) AS avg_months_past_due,
            MAX(months_past_due)               AS max_months_in_debt,
            MIN(months_past_due)               AS min_months_in_debt,

            COUNT(DISTINCT CASE WHEN months_past_due >= 6 THEN CodCliente_Ingreso END)  AS clients_over_6_months,
            COUNT(DISTINCT CASE WHEN months_past_due >= 12 THEN CodCliente_Ingreso END) AS clients_over_1_year,

            MAX(DATEDIFF(DAY, oldest_due_date, @Corte)) AS max_days_in_debt,
            AVG(total_debt_amount) AS avg_debt_per_client

        FROM (
            SELECT
                di.CodCliente_Ingreso,
                di.ClaveCatastral,

                COUNT(*) AS months_past_due,

                SUM(ISNULL(di.Valor_Titulo, 0)) AS total_epaa_value,
                SUM(ISNULL(di.ValorTerceros, 0)) AS total_terceros,
                SUM(ISNULL(di.tasa_basura, 0)) AS total_trash_rate,
                SUM(ISNULL(di.Recargo, 0)) AS total_surcharge,
                SUM(ISNULL(di.Recargo_old, 0)) AS total_old_surcharge,
                SUM(ISNULL(di.interes_mejoras, 0)) AS total_improvements_interest,

                SUM(
                    ISNULL(di.Valor_Titulo, 0)
                  + ISNULL(di.ValorTerceros, 0)
                  + ISNULL(di.tasa_basura, 0)
                  + ISNULL(di.Recargo, 0)
                  + ISNULL(di.interes_mejoras, 0)
                ) AS total_debt_amount,

                MIN(di.Fecha_Venc_Interes) AS oldest_due_date

            FROM Datos_ingreso di
            INNER JOIN (
                SELECT CodCliente_Ingreso
                FROM Datos_ingreso
                WHERE Fecha_Pago IS NULL
                  AND Estado_Ingreso IS NULL
                  AND convenio IS NULL
                  AND Fecha_Venc_Interes <= @Corte
                GROUP BY CodCliente_Ingreso
                HAVING COUNT(*) > 1
            ) AS cv ON di.CodCliente_Ingreso = cv.CodCliente_Ingreso

            WHERE di.Fecha_Pago IS NULL
              AND di.Estado_Ingreso IS NULL
              AND di.convenio IS NULL
              AND di.Fecha_Venc_Interes <= @Corte

            GROUP BY
                di.CodCliente_Ingreso,
                di.ClaveCatastral
            HAVING COUNT(*) > 1
        ) AS base;
      `;

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
      const query: string = `
        SET NOCOUNT ON;

        DECLARE @Today DATETIME;
        SET @Today = GETDATE();

        SELECT
            b.[year],

            t.total_unique_clients,
            t.total_unique_cadastral_keys,

            COUNT(DISTINCT b.CodCliente_Ingreso) AS clients_with_debt,
            COUNT(DISTINCT b.ClaveCatastral)     AS total_unique_cadastral_keys_by_year,

            SUM(months_past_due) AS total_months_past_due,
            SUM(total_debt_amount) AS total_debt_amount,

            SUM(total_epaa_value) AS total_epaa_value,
            SUM(total_trash_rate) AS total_trash_rate,
            SUM(total_surcharge) AS total_surcharge,
            SUM(total_old_surcharge) AS total_old_surcharge,
            SUM(total_improvements_interest) AS total_improvements_interest,

            AVG(CAST(months_past_due AS DECIMAL(10,2))) AS avg_months_past_due,
            MAX(months_past_due) AS max_months_in_debt,
            MIN(months_past_due) AS min_months_in_debt,

            COUNT(DISTINCT CASE WHEN months_past_due >= 6 THEN b.CodCliente_Ingreso END)  AS clients_over_6_months,
            COUNT(DISTINCT CASE WHEN months_past_due >= 12 THEN b.CodCliente_Ingreso END) AS clients_over_1_year,

            MAX(DATEDIFF(DAY, oldest_due_date, @Today)) AS max_days_in_debt,

            CAST(AVG(CAST(total_debt_amount AS DECIMAL(18,2))) AS DECIMAL(18,2)) AS avg_debt_per_client

        FROM (
            SELECT
                di.CodCliente_Ingreso,
                di.ClaveCatastral,
                YEAR(di.Fecha_Venc_Interes) AS [year],

                COUNT(*) AS months_past_due,

                SUM(ISNULL(di.Valor_Titulo, 0)) AS total_epaa_value,
                SUM(ISNULL(di.ValorTerceros, 0)) AS total_terceros,
                SUM(ISNULL(di.tasa_basura, 0)) AS total_trash_rate,
                SUM(ISNULL(di.Recargo, 0)) AS total_surcharge,
                SUM(ISNULL(di.Recargo_old, 0)) AS total_old_surcharge,
                SUM(ISNULL(di.interes_mejoras, 0)) AS total_improvements_interest,

                SUM(
                    ISNULL(di.Valor_Titulo, 0)
                  + ISNULL(di.ValorTerceros, 0)
                  + ISNULL(di.tasa_basura, 0)
                  + ISNULL(di.Recargo, 0)
                  + ISNULL(di.interes_mejoras, 0)
                ) AS total_debt_amount,

                MIN(di.Fecha_Venc_Interes) AS oldest_due_date

            FROM Datos_ingreso di
            INNER JOIN (
                SELECT
                    CodCliente_Ingreso,
                    ClaveCatastral
                FROM Datos_ingreso
                WHERE Fecha_Pago IS NULL
                  AND Estado_Ingreso IS NULL
                  AND convenio IS NULL
                  AND Fecha_Venc_Interes <= @Today
                GROUP BY CodCliente_Ingreso, ClaveCatastral
                HAVING COUNT(*) > 1
            ) AS cv ON di.CodCliente_Ingreso = cv.CodCliente_Ingreso
                  AND di.ClaveCatastral = cv.ClaveCatastral

            WHERE di.Fecha_Pago IS NULL
              AND di.Estado_Ingreso IS NULL
              AND di.convenio IS NULL
              AND di.Fecha_Venc_Interes <= @Today

            GROUP BY
                di.CodCliente_Ingreso,
                di.ClaveCatastral,
                YEAR(di.Fecha_Venc_Interes)
        ) AS b
        CROSS JOIN (
            SELECT
                COUNT(DISTINCT CodCliente_Ingreso) AS total_unique_clients,
                COUNT(DISTINCT ClaveCatastral)     AS total_unique_cadastral_keys
            FROM (
                SELECT
                    di.CodCliente_Ingreso,
                    di.ClaveCatastral
                FROM Datos_ingreso di
                INNER JOIN (
                    SELECT
                        CodCliente_Ingreso,
                        ClaveCatastral
                    FROM Datos_ingreso
                    WHERE Fecha_Pago IS NULL
                      AND Estado_Ingreso IS NULL
                      AND convenio IS NULL
                      AND Fecha_Venc_Interes <= @Today
                    GROUP BY CodCliente_Ingreso, ClaveCatastral
                    HAVING COUNT(*) > 1
                ) AS cv ON di.CodCliente_Ingreso = cv.CodCliente_Ingreso
                      AND di.ClaveCatastral = cv.ClaveCatastral
                WHERE di.Fecha_Pago IS NULL
                  AND di.Estado_Ingreso IS NULL
                  AND di.convenio IS NULL
                  AND di.Fecha_Venc_Interes <= @Today
                GROUP BY
                    di.CodCliente_Ingreso,
                    di.ClaveCatastral
            ) AS base_totales
        ) AS t

        GROUP BY
            b.[year],
            t.total_unique_clients,
            t.total_unique_cadastral_keys

        ORDER BY b.[year] DESC;
      `;

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
      const query: string = `
        SET NOCOUNT ON;
        SET ANSI_WARNINGS OFF;
        DECLARE @Today DATETIME
        SET @Today = GETDATE()

        SELECT 
            CodCliente_Ingreso,
            ClaveCatastral
        INTO #clientes_validos
        FROM Datos_ingreso
        WHERE Fecha_Pago IS NULL
          AND Estado_Ingreso IS NULL
          AND convenio IS NULL
          AND Fecha_Venc_Interes <= @Today
        GROUP BY CodCliente_Ingreso, ClaveCatastral
        HAVING COUNT(*) > 1

        SELECT
            di.CodCliente_Ingreso,
            di.ClaveCatastral,
            YEAR(di.Fecha_Venc_Interes)     AS [year],
            MONTH(di.Fecha_Venc_Interes)    AS [month],

            CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO'     WHEN 2 THEN 'FEBRERO'   WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL'     WHEN 5 THEN 'MAYO'      WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO'     WHEN 8 THEN 'AGOSTO'    WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE'  WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
            END AS month_name,

            COUNT(*) AS months_past_due,

            SUM(ISNULL(di.Valor_Titulo, 0))          AS total_epaa_value,
            SUM(ISNULL(di.ValorTerceros, 0))         AS total_terceros,
            SUM(ISNULL(di.tasa_basura, 0))           AS total_trash_rate,
            SUM(ISNULL(di.Recargo, 0))               AS total_surcharge,
            SUM(ISNULL(di.Recargo_old, 0))           AS total_old_surcharge,
            SUM(ISNULL(di.interes_mejoras, 0))       AS total_improvements_interest,

            SUM(
                ISNULL(di.Valor_Titulo, 0)
              + ISNULL(di.ValorTerceros, 0)
              + ISNULL(di.tasa_basura, 0)
              + ISNULL(di.Recargo, 0)
              + ISNULL(di.Recargo_old, 0)
              + ISNULL(di.interes_mejoras, 0)
            ) AS total_debt_amount,

            MIN(di.Fecha_Venc_Interes) AS oldest_due_date

        INTO #base
        FROM Datos_ingreso di
        INNER JOIN #clientes_validos cv
            ON di.CodCliente_Ingreso = cv.CodCliente_Ingreso
          AND di.ClaveCatastral = cv.ClaveCatastral
        WHERE di.Fecha_Pago IS NULL
          AND di.Estado_Ingreso IS NULL
          AND di.convenio IS NULL
          AND di.Fecha_Venc_Interes <= @Today
        GROUP BY 
            di.CodCliente_Ingreso,
            di.ClaveCatastral,
            YEAR(di.Fecha_Venc_Interes),
            MONTH(di.Fecha_Venc_Interes)

        SELECT
            COUNT(DISTINCT CodCliente_Ingreso) AS total_unique_clients,
            COUNT(DISTINCT ClaveCatastral)     AS total_unique_cadastral_keys
        INTO #totales
        FROM #base

        SELECT
            b.[year],
            b.[month],
            b.month_name,

            t.total_unique_clients,
            t.total_unique_cadastral_keys,

            COUNT(DISTINCT b.CodCliente_Ingreso) AS clients_with_debt_this_month,
            COUNT(DISTINCT b.ClaveCatastral)     AS unique_cadastral_keys_this_month,

            SUM(b.months_past_due)               AS total_months_past_due,
            SUM(b.total_debt_amount)             AS total_debt_amount,

            SUM(b.total_epaa_value)              AS total_epaa_value,
            SUM(b.total_trash_rate)              AS total_trash_rate,
            SUM(b.total_surcharge)               AS total_surcharge,
            SUM(b.total_old_surcharge)           AS total_old_surcharge,
            SUM(b.total_improvements_interest)   AS total_improvements_interest,

            AVG(CAST(b.months_past_due AS DECIMAL(10,2))) AS avg_months_past_due,
            MAX(b.months_past_due)                        AS max_months_in_debt,
            MIN(b.months_past_due)                        AS min_months_in_debt,

            COUNT(DISTINCT CASE WHEN b.months_past_due >= 6 THEN b.CodCliente_Ingreso END)  
                AS clients_over_6_months,

            COUNT(DISTINCT CASE WHEN b.months_past_due >= 12 THEN b.CodCliente_Ingreso END) 
                AS clients_over_1_year,

            MAX(DATEDIFF(DAY, b.oldest_due_date, @Today)) AS max_days_in_debt,

            CAST(AVG(CAST(b.total_debt_amount AS DECIMAL(18,2))) AS DECIMAL(18,2)) 
                AS avg_debt_per_client

        FROM #base b
        CROSS JOIN #totales t

        GROUP BY 
            b.[year],
            b.[month],
            b.month_name,
            t.total_unique_clients,
            t.total_unique_cadastral_keys

        ORDER BY b.[year] DESC, b.[month] DESC;

        DROP TABLE #clientes_validos
        DROP TABLE #base
        DROP TABLE #totales
        `;

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
      const query = `
        SET NOCOUNT ON

        DECLARE @searchParam VARCHAR(50)
        SET @searchParam = '${String(cadastralKey)}'

        SELECT
            c.CED_IDENT_CIUDADANO           AS card_id,
            c.NOMBRES_CIUDADANO             AS name,
            c.APELLIDOS_CIUDADANO           AS last_name,
            di.ClaveCatastral               AS cadastral_key,
            di.Direccion                    AS address,
            a.Tarifa                        AS rate,
            dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,
            l.Mes                           AS month,
            l.Anio                          AS year,
            l.LecturaActual                 AS current_reading,
            l.LecturaAnterior               AS previous_reading,
            l.ValorAPagar                   AS reading_value,
            CASE 
                WHEN l.LecturaActual IS NOT NULL 
                THEN (l.LecturaActual - l.LecturaAnterior) 
                ELSE NULL 
            END                             AS consumption,

            CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
            END                             AS month_due,
            
            YEAR(di.Fecha_Venc_Interes)     AS year_due,

            CASE
                WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE() 
                    THEN 'Pendiente de lectura (período actual/futuro)'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE() 
                    THEN 'Lectura no registrada o pendiente'
                ELSE 'No disponible'
            END                             AS reading_status,

            di.Fecha_Pago                   AS payment_date,
            
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura      ELSE NULL END AS trash_rate,
            CASE WHEN l.LecturaActual IS NOT NULL THEN (di.Valor_Titulo + di.Recargo)    ELSE NULL END AS epaa_value,
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros    ELSE NULL END AS third_party_value,
            
            CASE WHEN l.LecturaActual IS NOT NULL 
                THEN COALESCE(di.Valor_Titulo, 0) + 
                      COALESCE(di.ValorTerceros, 0) + 
                      dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) +
                      COALESCE(di.tasa_basura, 0) + COALESCE(di.Recargo, 0)
                ELSE NULL 
            END                             AS total,

            di.Fecha_Venc_Interes           AS due_date,
            di.Estado_Ingreso               AS income_status,
            di.Fecha_Ingreso                AS income_date

        FROM Datos_ingreso di
        INNER JOIN CIUDADANO c 
            ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

        INNER JOIN AP_ACOMETIDAS a
            ON a.Sector = 
                CASE 
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1 
                        AND ISNUMERIC(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) = 1
                        AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) <= 2
                    THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                    ELSE -1
                END
            AND a.Cuenta = 
                CASE 
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1 
                        AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1
                    THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))
                    ELSE -1
                END

        LEFT JOIN AP_LECTURAS l
            ON l.ClaveCatastral = di.ClaveCatastral
          AND l.Anio = YEAR(DATEADD(month, -1, di.Fecha_Venc_Interes))
          AND UPPER(LTRIM(RTRIM(l.Mes))) = UPPER(
                CASE MONTH(DATEADD(month, -1, di.Fecha_Venc_Interes))
                    WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                    WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                    WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                    WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
                END
            )

        WHERE 
            (
                (CHARINDEX('-', @searchParam) = 0 AND di.CodCliente_Ingreso = @searchParam)
                OR
                (CHARINDEX('-', @searchParam) > 0 AND di.ClaveCatastral = @searchParam)
            )
            AND di.Fecha_Pago IS NULL
            AND di.convenio   IS NULL
            AND di.Estado_Ingreso IS NULL

        ORDER BY 
            di.ClaveCatastral,
            di.Fecha_Venc_Interes DESC;
      `;

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
      const query = `
      SET NOCOUNT ON

      DECLARE @searchParam VARCHAR(50)
      SET @searchParam = '${String(cardId)}'

      SELECT
          c.CED_IDENT_CIUDADANO           AS card_id,
          c.NOMBRES_CIUDADANO             AS name,
          c.APELLIDOS_CIUDADANO           AS last_name,
          di.ClaveCatastral               AS cadastral_key,
          di.Direccion                    AS address,
          a.Tarifa                        AS rate,
          dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,
          l.Mes                           AS month,
          l.Anio                          AS year,
          l.LecturaActual                 AS current_reading,
          l.LecturaAnterior               AS previous_reading,
          l.ValorAPagar                   AS reading_value,
          CASE 
              WHEN l.LecturaActual IS NOT NULL 
              THEN (l.LecturaActual - l.LecturaAnterior) 
              ELSE NULL 
          END                             AS consumption,

          CASE MONTH(di.Fecha_Venc_Interes)
              WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
              WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
              WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
              WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
          END                             AS month_due,
          
          YEAR(di.Fecha_Venc_Interes)     AS year_due,

          CASE
              WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
              WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE() 
                  THEN 'Pendiente de lectura (período actual/futuro)'
              WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE() 
                  THEN 'Lectura no registrada o pendiente'
              ELSE 'No disponible'
          END                             AS reading_status,

          di.Fecha_Pago                   AS payment_date,
          
          CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura      ELSE NULL END AS trash_rate,
          CASE WHEN l.LecturaActual IS NOT NULL THEN (di.Valor_Titulo + di.Recargo)     ELSE NULL END AS epaa_value,
          CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros    ELSE NULL END AS third_party_value,
          
          CASE WHEN l.LecturaActual IS NOT NULL 
              THEN COALESCE(di.Valor_Titulo, 0) + 
                    COALESCE(di.ValorTerceros, 0) + 
                    dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) +
                    COALESCE(di.tasa_basura, 0) + COALESCE(di.Recargo, 0)
              ELSE NULL 
          END                             AS total,

          di.Fecha_Venc_Interes           AS due_date,
          di.Estado_Ingreso               AS income_status,
          di.Fecha_Ingreso                AS income_date

      FROM Datos_ingreso di
      INNER JOIN CIUDADANO c 
          ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

      INNER JOIN AP_ACOMETIDAS a
          ON a.Sector = 
              CASE 
                  WHEN CHARINDEX('-', di.ClaveCatastral) > 1 
                      AND ISNUMERIC(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) = 1
                      AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) <= 2
                  THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                  ELSE -1
              END
          AND a.Cuenta = 
              CASE 
                  WHEN CHARINDEX('-', di.ClaveCatastral) > 1 
                      AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1
                  THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))
                  ELSE -1
              END

      LEFT JOIN AP_LECTURAS l
          ON l.ClaveCatastral = di.ClaveCatastral
        AND l.Anio = YEAR(DATEADD(month, -1, di.Fecha_Venc_Interes))
        AND UPPER(LTRIM(RTRIM(l.Mes))) = UPPER(
              CASE MONTH(DATEADD(month, -1, di.Fecha_Venc_Interes))
                  WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                  WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                  WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                  WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
              END
          )

      WHERE 
          (
              (CHARINDEX('-', @searchParam) = 0 AND di.CodCliente_Ingreso = @searchParam)
              OR
              (CHARINDEX('-', @searchParam) > 0 AND di.ClaveCatastral = @searchParam)
          )
          AND di.Fecha_Pago IS NULL
          AND di.convenio   IS NULL
          AND di.Estado_Ingreso IS NULL

      ORDER BY 
          di.ClaveCatastral,
          di.Fecha_Venc_Interes DESC;
    `;

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
      const query = `
        SET NOCOUNT ON

        DECLARE @searchParam VARCHAR(50)
        SET @searchParam = '${String(searchValue.trim())}'

        SELECT
            -- ── Identificación del cliente y suministro ──────────────────────────────────
			      di.Cod_Ingreso                  AS income_code,
            c.CED_IDENT_CIUDADANO           AS card_id,
            c.NOMBRES_CIUDADANO             AS name,
            c.APELLIDOS_CIUDADANO           AS last_name,
            di.ClaveCatastral               AS cadastral_key,
            di.Direccion                    AS address,
            a.Tarifa                        AS rate,

            -- Interes
            dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,

            -- ── Período de facturación ────────────────────────────────────────────────────
            l.Mes                           AS month,
            l.Anio                          AS year,

            CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
            END                             AS month_due,

            YEAR(di.Fecha_Venc_Interes)     AS year_due,
            di.Fecha_Venc_Interes           AS due_date,
            di.Fecha_Pago                   AS payment_date,

            -- ── Lectura del medidor ───────────────────────────────────────────────────────
            l.LecturaActual                 AS current_reading,
            l.LecturaAnterior               AS previous_reading,
            CASE
                WHEN l.LecturaActual IS NOT NULL
                THEN (l.LecturaActual - l.LecturaAnterior)
                ELSE NULL
            END                             AS consumption,

            CASE
                WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE()
                    THEN 'Pendiente de lectura (período actual/futuro)'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE()
                    THEN 'Lectura no registrada o pendiente'
                ELSE 'No disponible'
            END                             AS reading_status,

            -- ── EPAA: valor del servicio de agua ─────────────────────────────────────────
            -- Valor por consumo de agua (según lectura del medidor)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.Valor_Titulo    ELSE NULL END AS epaa_value,
            -- Valor por servicios de terceros (alcantarillado, etc.)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros   ELSE NULL END AS third_party_value,
            -- Valor unitario por m³ consumido
            l.ValorAPagar                   AS reading_value,
            -- Recargo por mora u otro concepto general
            di.Recargo                      AS surcharge,
            -- Total EPAA: agua + terceros (sin basura ni ajuste de tarifa)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                   + COALESCE(di.ValorTerceros, 0)
                   + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
                   + COALESCE(di.Recargo, 0)
                ELSE NULL
            END                             AS total_epaa_value,

            -- ── Tasa de recolección de basura ─────────────────────────────────────────────
            -- Tarifa de basura OFICIAL (para mostrar como información de la tabla)
            CASE WHEN l.LecturaActual IS NOT NULL THEN ISNULL(v.Valor, di.tasa_basura)     ELSE NULL END AS trash_rate_official,
            
            -- Lo que EFECTIVAMENTE paga el usuario por basura este mes 
            -- (Si hay saldo a favor y cubre todo, paga 0)
            CASE WHEN l.LecturaActual IS NOT NULL 
                THEN 
                    CASE 
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN 
                            CASE 
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL 
            END                             AS trash_rate,

            -- Crédito original que arrastra del pasado (sólo informativo)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura_anterior_oficial ELSE NULL END AS trash_rate_previous,
            -- Saldo a favor actual
            CASE WHEN l.LecturaActual IS NOT NULL THEN anc.Valor ELSE NULL END AS balance_in_favor_current_month,
            -- Saldo a favor sobrante para el PRÓXIMO MES
            CASE WHEN l.LecturaActual IS NOT NULL AND COALESCE(anc.Valor, 0) > 0
                THEN 
                    CASE 
                        WHEN anc.Valor > ISNULL(v.Valor, di.tasa_basura) THEN anc.Valor - ISNULL(v.Valor, di.tasa_basura)
                        ELSE 0
                    END
                ELSE NULL
            END                             AS balance_in_favor_next_month,

            -- Saldo en contra: se anula por completo (nunca hay saldo a favor de la empresa)
            NULL                            AS balance_against_next_month,
            -- Descuento aplicado sobre la tasa de basura (solo en registros pagados, aquí siempre 0)
            COALESCE(di.descuento_tb, 0)    AS discount_trash_rate,
            -- Total neto de basura = lo que le toca pagar finalmente este mes
            CASE WHEN l.LecturaActual IS NOT NULL 
                THEN 
                    CASE 
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN 
                            CASE 
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL 
            END                             AS total_trash_rate,

            -- ── Totales de la planilla ────────────────────────────────────────────────────
            -- Total base: EPAA + terceros + basura actual + recargo (sin ajuste de tarifa)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                   + COALESCE(di.ValorTerceros, 0)
                   + COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                   + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
                   + COALESCE(di.Recargo, 0)
                -- descuento_tb no aplica: solo existe en registros pagados (Fecha_Pago IS NOT NULL)
                ELSE NULL
            END                             AS total,

            -- Total ajustado: Total consolidado del cliente
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                   + COALESCE(di.ValorTerceros, 0)
                   + COALESCE(di.Recargo, 0)
                   + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
                   + CASE 
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN 
                            CASE 
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                     END
                ELSE NULL
            END                             AS adjusted_total,

            -- ── Metadatos de ingreso ──────────────────────────────────────────────────────
            di.Estado_Ingreso               AS income_status,
            di.Fecha_Ingreso                AS income_date

        FROM Datos_ingreso di
        INNER JOIN CIUDADANO c
            ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

        INNER JOIN AP_ACOMETIDAS a
            ON a.Sector =
                CASE
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                        AND ISNUMERIC(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) = 1
                        AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) <= 2
                    THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                    ELSE -1
                END
            AND a.Cuenta =
                CASE
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                        AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1
                    THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))
                    ELSE -1
                END

        LEFT JOIN AP_LECTURAS l
            ON l.ClaveCatastral = di.ClaveCatastral
          AND l.Anio = YEAR(DATEADD(month, -1, di.Fecha_Venc_Interes))
          AND UPPER(LTRIM(RTRIM(l.Mes))) = UPPER(
                CASE MONTH(DATEADD(month, -1, di.Fecha_Venc_Interes))
                    WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                    WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                    WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                    WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
                END
            )

        LEFT JOIN AP_NotasCredito anc
            ON di.ClaveCatastral = anc.Cuenta

        LEFT JOIN Valor v
            ON di.Cod_Ingreso = v.cod_Ingreso AND v.orden = 10

        WHERE
            (
                (CHARINDEX('-', @searchParam) = 0 AND di.CodCliente_Ingreso = @searchParam)
                OR
                (CHARINDEX('-', @searchParam) > 0 AND di.ClaveCatastral = @searchParam)
            )
            AND di.Fecha_Pago IS NULL
            AND di.convenio   IS NULL
            AND di.Estado_Ingreso IS NULL

        ORDER BY
            di.ClaveCatastral,
            di.Fecha_Venc_Interes DESC;
      `;

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
      const query = `
        SELECT TOP 1 1
        FROM AP_LECTURAS
        WHERE ClaveCatastral = '${String(searchValue.trim())}'
           OR card_id = '${String(searchValue.trim())}'
      `;
      // Note: card_id might not exist in AP_LECTURAS directly, usually it's checked through ClaveCatastral
      // But for simplicity and matching the existing logic:
      const result = await this.sqlServerService.query(query);
      return result.length > 0;
    } catch (error) {
      console.error('Error al verificar existencia de lectura:', error);
      return false;
    }
  }
}
