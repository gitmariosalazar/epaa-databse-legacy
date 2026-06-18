import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../../settings/environments/status-code';
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
import { SQLServerAccountingAdapter } from '../adapters/sql-server.accounting.adapter';
import {
  PendingReadingSQLResult,
  PaymentSqlResponse,
  PaymentReadingSqlResponse,
  OverduePaymentSqlResponse,
  OverdueSummarySqlResult,
  YearlyOverdueSummarySqlResult,
  MonthlyDebtSummarySqlResult,
} from '../../../interfaces/sql/accounting.sql.response';

@Injectable()
export class SQLServerAccountingPersistence implements InterfaceAccountingRepository {
  constructor(private readonly sqlServerService: DatabaseAbstract) {}

  async findPendingReadingsByCardId(
    cardId: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      const query = `
        SELECT 
            c.CED_IDENT_CIUDADANO AS card_id,
            c.NOMBRES_CIUDADANO AS name,
            c.APELLIDOS_CIUDADANO AS last_name ,
            di.ClaveCatastral AS cadastral_key,
            di.Direccion AS address,
            a.Tarifa AS rate,
            dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,
            l.Mes AS month,
            l.Anio AS year,
            l.LecturaActual AS current_reading,
            l.LecturaAnterior AS previous_reading,
            CASE WHEN l.LecturaActual IS NOT NULL 
                THEN (l.LecturaActual - l.LecturaAnterior) 
                ELSE NULL 
            END AS consumption,
            CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
            END AS month_due,
            YEAR(di.Fecha_Venc_Interes) AS year_due,
            CASE 
                WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE() THEN 'Pendiente de lectura (período actual/futuro)'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE() THEN 'Lectura no registrada o pendiente'
                ELSE 'No disponible'
            END AS reading_status,
            di.Fecha_Pago,
            di.tasa_basura AS trash_rate,
            di.Valor_Titulo        AS epaa_value,
            di.ValorTerceros       AS third_party_value,
            dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,
            (COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.tasa_basura, 0) + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())) AS total,
            di.Fecha_Venc_Interes AS due_date,
            di.Estado_Ingreso AS income_status,
            di.Fecha_Ingreso
        FROM Datos_ingreso di
        INNER JOIN CIUDADANO c ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO
        INNER JOIN AP_ACOMETIDAS a ON a.clave_catastral = di.ClaveCatastral
        LEFT JOIN AP_LECTURAS l
            ON l.ClaveCatastral = di.ClaveCatastral
            AND l.Anio = YEAR(di.Fecha_Venc_Interes)
            AND UPPER(LTRIM(RTRIM(l.Mes))) = UPPER(CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
                ELSE NULL
            END)
        WHERE di.CodCliente_Ingreso = @cardId
          AND di.Estado_Ingreso IS NULL
          AND di.Fecha_Pago IS NULL
        ORDER BY di.ClaveCatastral, di.Fecha_Ingreso DESC;
    `;

      const queryParams: any[] = [
        {
          name: 'cardId',
          value: cardId,
        },
      ];

      const result = await this.sqlServerService.query<PendingReadingSQLResult>(
        query,
        queryParams,
      );

      const pendingReadings = result.map((reading) =>
        SQLServerAccountingAdapter.toDomainPending(reading),
      );

      return pendingReadings;
    } catch (error) {
      console.error('Error al buscar lecturas pendientes:', error);
      throw error;
    }
  }

  async findPendingReadingsByCadastralKey(
    cadastralKey: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      const query = `
        SELECT 
            c.CED_IDENT_CIUDADANO AS card_id,
            c.NOMBRES_CIUDADANO AS name,
            c.APELLIDOS_CIUDADANO AS last_name ,
            di.ClaveCatastral AS cadastral_key,
            di.Direccion AS address,
            a.Tarifa AS rate,
            dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,
            l.Mes AS month,
            l.Anio AS year,
            l.LecturaActual AS current_reading,
            l.LecturaAnterior AS previous_reading,
            CASE WHEN l.LecturaActual IS NOT NULL 
                THEN (l.LecturaActual - l.LecturaAnterior) 
                ELSE NULL 
            END AS consumption,
            CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
            END AS month_due,
            YEAR(di.Fecha_Venc_Interes) AS year_due,
            CASE 
                WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE() THEN 'Pendiente de lectura (período actual/futuro)'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE() THEN 'Lectura no registrada o pendiente'
                ELSE 'No disponible'
            END AS reading_status,
            di.Fecha_Pago,
            di.tasa_basura AS trash_rate,
            di.Valor_Titulo        AS epaa_value,
            di.ValorTerceros       AS third_party_value,
            dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,
            (COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.tasa_basura, 0) + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())) AS total,
            di.Fecha_Venc_Interes AS due_date,
            di.Estado_Ingreso AS income_status,
            di.Fecha_Ingreso
        FROM Datos_ingreso di
        INNER JOIN CIUDADANO c ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO
        INNER JOIN AP_ACOMETIDAS a ON a.clave_catastral = di.ClaveCatastral
        LEFT JOIN AP_LECTURAS l
            ON l.ClaveCatastral = di.ClaveCatastral
            AND l.Anio = YEAR(di.Fecha_Venc_Interes)
            AND UPPER(LTRIM(RTRIM(l.Mes))) = UPPER(CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
                ELSE NULL
            END)
        WHERE di.ClaveCatastral = @cadastralKey
          AND di.Estado_Ingreso IS NULL
          AND di.Fecha_Pago IS NULL
        ORDER BY di.ClaveCatastral, di.Fecha_Ingreso DESC;
    `;

      const queryParams: any[] = [
        {
          name: 'cadastralKey',
          value: cadastralKey,
        },
      ];

      const result = await this.sqlServerService.query<PendingReadingSQLResult>(
        query,
        queryParams,
      );

      const pendingReadings = result.map((reading) =>
        SQLServerAccountingAdapter.toDomainPending(reading),
      );

      return pendingReadings;
    } catch (error) {
      console.error('Error al buscar lecturas pendientes:', error);
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

            -- Interés calculado dinámicamente en función al valor del título y la fecha de vencimiento
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
                   + COALESCE(di.Recargo, 0)
                   + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
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
                   + COALESCE(di.Recargo, 0)
                   + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
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
            di.Fecha_Ingreso                AS income_date,
            -- Vencido o no vencido
            CASE
              WHEN di.Fecha_Venc_Interes < CAST(GETDATE() AS DATE) THEN 'Vencido'
                ELSE 'No Vencido'
            END AS due_date_status

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

      const queryParams: any[] = [
        {
          name: 'searchValue',
          value: searchValue.trim(),
        },
      ];

      const result = await this.sqlServerService.query<PendingReadingSQLResult>(
        query,
        queryParams,
      );

      const pendingReadings = result.map((reading) =>
        SQLServerAccountingAdapter.toDomainPending(reading),
      );

      return pendingReadings;
    } catch (error) {
      console.error(
        'Error al buscar lecturas pendientes por clave catastral o número de tarjeta:',
        error,
      );
      throw error;
    }
  }

  async findPendingReadingsByCadastralKeyOrCardIdAll(
    searchValue: string,
  ): Promise<PendingReadingResponse[]> {
    try {
      const query = `
        SET NOCOUNT ON  
          
        DECLARE @searchParam VARCHAR(50) = '${String(searchValue.trim())}';  
          
        SELECT  
            di.Cod_Ingreso                  AS income_code,
            di.Cod_Titulo_Datos      AS income_title_code,
            l.FechaCaptura                 AS reading_capture_date,
            c.CED_IDENT_CIUDADANO           AS card_id,  
            c.NOMBRES_CIUDADANO             AS name,  
            c.APELLIDOS_CIUDADANO           AS last_name,  
            di.ClaveCatastral               AS cadastral_key,  
            di.Direccion                    AS address,  
            COALESCE(a.Tarifa, NULL)        AS rate,  

            -- INterés calculado dinámicamente en función al valor del título y la fecha de vencimiento
            dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,
          
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
          
            -- Lectura  
            l.LecturaActual                 AS current_reading,  
            l.LecturaAnterior               AS previous_reading,  
            CASE WHEN l.LecturaActual IS NOT NULL  
                THEN (l.LecturaActual - l.LecturaAnterior)  
                ELSE NULL END              AS consumption,  
          
            CASE  
                WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'  
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE()  
                    THEN 'Pendiente de lectura (período actual/futuro)'  
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE()  
                    THEN 'Lectura no registrada o pendiente'  
                ELSE 'No disponible'  
            END                             AS reading_status,  
          
            -- === EPAA: Ahora muestra valores aunque no haya lectura ===  
            di.Valor_Titulo                 AS epaa_value,                    -- ← Cambiado  
            di.ValorTerceros                AS third_party_value,             -- ← Cambiado  
            l.ValorAPagar                   AS reading_value,  
            di.Recargo                      AS surcharge,  
          
            -- Total EPAA (muestra aunque no haya lectura)  
            COALESCE(di.Valor_Titulo, 0)  
            + COALESCE(di.ValorTerceros, 0)
            + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())  
            + COALESCE(di.Recargo, 0)       AS total_epaa_value,  
          
            -- === Basura ===  
            ISNULL(v.Valor, di.tasa_basura) AS trash_rate_official,  
          
            CASE  
                WHEN COALESCE(anc.Valor, 0) > 0 THEN  
                    CASE  
                        WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0  
                        ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor  
                    END  
                ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)  
            END                             AS trash_rate,  
          
            di.tasa_basura_anterior_oficial AS trash_rate_previous,  
            anc.Valor                       AS balance_in_favor_current_month,  
          
            CASE  
                WHEN COALESCE(anc.Valor, 0) > 0 AND anc.Valor > ISNULL(v.Valor, di.tasa_basura)  
                THEN anc.Valor - ISNULL(v.Valor, di.tasa_basura)  
                ELSE 0  
            END                             AS balance_in_favor_next_month,  
          
            NULL                            AS balance_against_next_month,  
            COALESCE(di.descuento_tb, 0)    AS discount_trash_rate,  
          
            CASE  
                WHEN COALESCE(anc.Valor, 0) > 0 THEN  
                    CASE  
                        WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0  
                        ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor  
                    END  
                ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)  
            END                             AS total_trash_rate,  
          
            -- Totales  
            COALESCE(di.Valor_Titulo, 0)  
            + COALESCE(di.ValorTerceros, 0)  
            + COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)  
            + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
            + COALESCE(di.Recargo, 0)       AS total,  
          
            COALESCE(di.Valor_Titulo, 0)  
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
              END                           AS adjusted_total,  
          
            di.Estado_Ingreso               AS income_status,  
            di.Fecha_Ingreso                AS income_date,
            CASE
              WHEN di.Fecha_Venc_Interes < CAST(GETDATE() AS DATE) THEN 'Vencido'
                ELSE 'No Vencido'
            END AS due_date_status  
          
        FROM Datos_ingreso di  
        LEFT JOIN CIUDADANO c ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO  
          
        LEFT JOIN AP_ACOMETIDAS a  
            ON a.Sector = CASE  
                            WHEN CHARINDEX('-', di.ClaveCatastral) > 1  
                                AND ISNUMERIC(NULLIF(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1), '')) = 1  
                                AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) BETWEEN 1 AND 2  
                            THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))  
                            ELSE NULL  
                          END  
            AND a.Cuenta = CASE  
                            WHEN CHARINDEX('-', di.ClaveCatastral) > 1  
                                AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1  
                            THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))  
                            ELSE NULL  
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
          
        LEFT JOIN AP_NotasCredito anc ON di.ClaveCatastral = anc.Cuenta  
        LEFT JOIN Valor v ON di.Cod_Ingreso = v.cod_Ingreso AND v.orden = 10  
          
        WHERE  
            (  
                (CHARINDEX('-', @searchParam) = 0 AND di.CodCliente_Ingreso = @searchParam)  
                OR  
                (CHARINDEX('-', @searchParam) > 0 AND di.ClaveCatastral = @searchParam)  
            )  
            AND di.Fecha_Pago IS NULL  
            AND di.convenio IS NULL  
            AND di.Estado_Ingreso IS NULL  
          
        ORDER BY di.ClaveCatastral, di.Fecha_Venc_Interes DESC;
    `;

      const queryParams: any[] = [
        {
          name: 'searchValue',
          value: searchValue.trim(),
        },
      ];

      const result = await this.sqlServerService.query<PendingReadingSQLResult>(
        query,
        queryParams,
      );

      const pendingReadings = result.map((reading) =>
        SQLServerAccountingAdapter.toDomainPending(reading),
      );

      return pendingReadings;
    } catch (error) {
      console.error(
        'Error al buscar lecturas pendientes por clave catastral o número de tarjeta:',
        error,
      );
      throw error;
    }
  }

  async verifyReadingExists(searchValue: string): Promise<boolean> {
    try {
      const query = `
        SET NOCOUNT ON;
        DECLARE @searchParam VARCHAR(50)
        SET @searchParam = '${String(searchValue.trim())}'

        SELECT 
            CASE 
                WHEN EXISTS (
                    SELECT 1
                    FROM Datos_ingreso di
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
                    WHERE 
                        (
                            (CHARINDEX('-', @searchParam) = 0 AND di.CodCliente_Ingreso = @searchParam)
                            OR
                            (CHARINDEX('-', @searchParam) > 0 AND di.ClaveCatastral = @searchParam)
                        )
                ) THEN 1 ELSE 0 
            END AS hasConnection;
      `;
      const queryParams: any[] = [
        {
          name: 'searchValue',
          value: searchValue.trim(),
        },
      ];
      const result = await this.sqlServerService.query<{
        hasConnection: number;
      }>(query, queryParams);
      return result.length > 0 && result[0].hasConnection === 1;
    } catch (error) {
      console.error('Error al verificar si existe la lectura:', error);
      throw error;
    }
  }

  async findAllPaymentByDateAndOrderValue(
    paymentDate: string,
    orderValue: number,
  ): Promise<PaymentResponse[]> {
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
            (COALESCE(di.Valor_Titulo,0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.tasa_basura, 0)) AS total,
            di.User_Cobro AS payment_user,
            v.Valor as value,
            v.orden AS order_value,
            di.FormaDePago AS payment_method,
            di.Comentario AS comment
          FROM Datos_ingreso di
              INNER JOIN Valor V on di.Cod_Ingreso = V.cod_Ingreso AND V.orden = ${orderValue}
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

      if (response.length === 0) {
        return [];
      }

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
      SET NOCOUNT ON

      SELECT
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
          CASE WHEN l.LecturaActual IS NOT NULL THEN (di.Valor_Titulo + di.Recargo)     ELSE NULL END AS epaa_value,
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
          v.Valor as value,
          v.orden AS order_value,
          di.FormaDePago AS payment_method,
          di.Comentario AS comment

      FROM Datos_ingreso di
      INNER JOIN CIUDADANO c
          ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

        INNER JOIN AP_ACOMETIDAS a
            ON a.Sector = CASE
                WHEN CHARINDEX('-', di.ClaveCatastral) > 0
                     AND PATINDEX('%[^0-9]%',
                                  LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)
                                 ) = 0
                THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                ELSE -1
            END
            AND a.Cuenta = CASE
                WHEN CHARINDEX('-', di.ClaveCatastral) > 0
                     AND PATINDEX('%[^0-9]%',
                                  SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)
                                 ) = 0
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
      INNER JOIN dbo.Valor V on di.Cod_Ingreso = V.cod_Ingreso AND v.cod_Ingreso = di.Cod_Ingreso AND v.orden = 10
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

      if (response.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Payments not found for the given date: ${paymentDate}`,
        });
      }

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

      if (response.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Payments not found for the given date: ${paymentDate}`,
        });
      }
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
        Number.isInteger(limit) && limit! > 0 ? limit! : 1000000;
      const query: string = `
        SET NOCOUNT ON
        DECLARE @offset        INT
        DECLARE @limit         INT
        SET @offset        = ${safeOffset}
        SET @limit         = ${safeLimit}

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
            (COALESCE(di.Valor_Titulo,0) + COALESCE(di.ValorTerceros,0) +
             COALESCE(di.Recargo,0) + COALESCE(di.tasa_basura,0)) AS total,
            di.User_Cobro AS payment_user,
            SUM(v.Valor) AS value
          FROM Datos_ingreso di
          INNER JOIN Valor v ON di.Cod_Ingreso = v.cod_Ingreso
          WHERE di.Fecha_Pago >= CONVERT(DATETIME, '${initDateTime}', 120)
            AND di.Fecha_Pago <= CONVERT(DATETIME, '${endDateTime}', 120)
          GROUP BY
            di.Cod_Ingreso, di.CodCliente_Ingreso, di.nombre, di.Fecha_Ingreso, di.Fecha_Pago,
            di.Estado_Ingreso, di.Cod_Titulo_Datos, di.Fecha_Venc_Interes, di.Valor_Titulo,
            di.ValorTerceros, di.Recargo, di.tasa_basura, di.ClaveCatastral,
            di.FormaDePago, di.Comentario, di.User_Cobro
          ORDER BY di.Fecha_Ingreso DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY;
        `;

      const result =
        await this.sqlServerService.query<PaymentSqlResponse>(query);

      const response: PaymentResponse[] = result.map((item) =>
        SQLServerAccountingAdapter.fromPaymentSqlResponseToPaymentResponse(
          item,
        ),
      );

      if (response.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Payments not found for the given date range: ${initDate} - ${endDate}`,
        });
      }
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

        DECLARE @Corte DATE = GETDATE();

        SELECT
            di.ClaveCatastral         AS cadastral_key,
            di.CodCliente_Ingreso     AS client_id,
            MAX(di.nombre)             AS name,
            SUM(COALESCE(di.tasa_basura,      0)) AS total_trash_rate,
            SUM(COALESCE(di.Valor_Titulo,     0)) AS total_epaa_value,
            SUM(COALESCE(di.interes_mejoras,  0)) AS total_old_improvements_interest,
            SUM(COALESCE(di.Recargo,          0)) AS total_surcharge,
            SUM(COALESCE(di.Recargo_old,      0)) AS total_old_surcharge,
            COUNT(di.Cod_Ingreso)                 AS months_past_due,
        -- Suma el valor pre-calculado de la tabla física de caché
        SUM(COALESCE(c.interes_calculado, 0))     AS total_interest_calculated,
        
        -- Suma total general sumando el interés pre-calculado
        SUM(
            COALESCE(di.tasa_basura, 0) +
            COALESCE(di.Valor_Titulo, 0) +
            COALESCE(di.interes_mejoras, 0) +
            COALESCE(di.Recargo, 0) +
            COALESCE(c.interes_calculado, 0)
        )                                         AS total_debt_amount,
        -- Fechas
        MIN(di.Fecha_Ingreso)                     AS emision_date_more_old,
        MAX(di.Fecha_Ingreso)                     AS emision_date_more_recent,
        MIN(di.Fecha_Venc_Interes)                AS due_date_more_old,
        MAX(di.Fecha_Venc_Interes)                AS due_date_more_recent,
        -- Días transcurridos desde el vencimiento de la planilla más antigua
        DATEDIFF(day, MIN(di.Fecha_Venc_Interes), GETDATE()) AS days_since_due,
        -- Días transcurridos desde la fecha de ingreso
        DATEDIFF(day, MIN(di.Fecha_Ingreso), GETDATE()) AS days_since_emission
        FROM Datos_ingreso di
        -- CRUCE CON LA CACHÉ
        LEFT JOIN dbo.Datos_ingreso_interes_cache c
          ON di.Cod_Ingreso = c.Cod_Ingreso
        WHERE di.Fecha_Pago    IS NULL
          AND di.Estado_Ingreso IS NULL
          AND di.convenio       IS NULL
          AND di.Fecha_Venc_Interes <= @Corte
        GROUP BY di.ClaveCatastral, di.CodCliente_Ingreso
        HAVING COUNT(di.Cod_Ingreso) > 1
        ORDER BY di.CodCliente_Ingreso, di.ClaveCatastral
        OFFSET ${safeOffset} ROWS
        FETCH NEXT ${safeLimit} ROWS ONLY;
      `;

      const result =
        await this.sqlServerService.query<OverduePaymentSqlResponse>(query);

      const response: OverduePaymentResponse[] = result.map((item) =>
        SQLServerAccountingAdapter.fromOverduePaymentSqlResponseToOverduePaymentResponse(
          item,
        ),
      );

      if (response.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No overdue readings found.`,
        });
      }

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

        DECLARE @Corte DATE = GETDATE();

        ;WITH filtered AS (
            SELECT
                di.CodCliente_Ingreso,
                di.ClaveCatastral,
                di.Valor_Titulo,
                di.ValorTerceros,
                di.tasa_basura,
                di.Recargo,
                di.interes_mejoras,
                di.Fecha_Venc_Interes,
                COALESCE(c.interes_calculado, 0) AS interest_calculated,
                COUNT(*) OVER (PARTITION BY di.CodCliente_Ingreso) AS client_debt_rows
            FROM Datos_ingreso di

            -- CRUCE CON LA CACHÉ
            LEFT JOIN dbo.Datos_ingreso_interes_cache c
              ON di.Cod_Ingreso = c.Cod_Ingreso
            WHERE di.Fecha_Pago IS NULL
              AND di.Estado_Ingreso IS NULL
              AND di.convenio IS NULL
              AND di.Fecha_Venc_Interes <= @Corte
        ),
        base AS (
            SELECT
                f.CodCliente_Ingreso,
                f.ClaveCatastral,

                COUNT(*) AS months_past_due,

                SUM(ISNULL(f.Valor_Titulo, 0)) AS total_epaa_value,
                SUM(ISNULL(f.ValorTerceros, 0)) AS total_terceros,
                SUM(ISNULL(f.tasa_basura, 0)) AS total_trash_rate,
                SUM(ISNULL(f.Recargo, 0)) AS total_surcharge,
                SUM(ISNULL(f.interes_mejoras, 0)) AS total_improvements_interest,
                SUM(ISNULL(f.interest_calculated, 0)) AS total_interest_calculated,

                SUM(
                    ISNULL(f.tasa_basura, 0)
                  + ISNULL(f.Valor_Titulo, 0)
                  + ISNULL(f.interes_mejoras, 0)
                  + ISNULL(f.Recargo, 0)
                  + ISNULL(f.interest_calculated, 0)
                ) AS total_debt_amount,

                MIN(f.Fecha_Venc_Interes) AS oldest_due_date

            FROM filtered f
            WHERE f.client_debt_rows > 1

            GROUP BY
                f.CodCliente_Ingreso,
                f.ClaveCatastral
            HAVING COUNT(*) > 1
        )

        SELECT
            COUNT(DISTINCT CodCliente_Ingreso) AS total_clients_with_debt,
            COUNT(DISTINCT ClaveCatastral)     AS total_unique_cadastral_keys,

            SUM(months_past_due)               AS total_months_past_due,
            SUM(total_debt_amount)             AS total_debt_amount,

            SUM(total_epaa_value)              AS total_epaa_value,
            SUM(total_trash_rate)              AS total_trash_rate,
            SUM(total_surcharge)               AS total_surcharge,
            SUM(total_improvements_interest)   AS total_improvements_interest,
            SUM(total_interest_calculated)     AS total_interest_calculated,

            AVG(CAST(months_past_due AS DECIMAL(10,2))) AS avg_months_past_due,
            MAX(months_past_due)               AS max_months_in_debt,
            MIN(months_past_due)               AS min_months_in_debt,

            COUNT(DISTINCT CASE WHEN months_past_due >= 6 THEN CodCliente_Ingreso END)  AS clients_over_6_months,
            COUNT(DISTINCT CASE WHEN months_past_due >= 12 THEN CodCliente_Ingreso END) AS clients_over_1_year,

            MAX(DATEDIFF(DAY, oldest_due_date, @Corte)) AS max_days_in_debt,
            AVG(total_debt_amount) AS avg_debt_per_client

        FROM base
        OPTION (RECOMPILE);
      `;

      const result =
        await this.sqlServerService.query<OverdueSummarySqlResult>(query);

      if (result.length === 0) {
        return null;
      }

      const response: OverdueSummaryResponse =
        SQLServerAccountingAdapter.fromOverdueSummarySqlResultToOverdueSummaryResponse(
          result[0],
        );

      return response;
    } catch (error) {
      console.error('Error al buscar el resumen de lecturas vencidas:', error);
      throw error;
    }
  }

  async findYearlyOverdueSummary(): Promise<YearlyOverdueSummaryResponse[]> {
    try {
      const query: string = `
        SET NOCOUNT ON;

        DECLARE @Today DATE = GETDATE();

        ;WITH clientes_validos AS (
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
        ),
        base AS (
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
                SUM(ISNULL(c.interes_calculado, 0)) AS total_interest_calculated,

                SUM(
                    ISNULL(di.tasa_basura, 0)
                  + ISNULL(di.Valor_Titulo, 0)
                  + ISNULL(di.interes_mejoras, 0)
                  + ISNULL(di.Recargo, 0)
                  + ISNULL(c.interes_calculado, 0)
                ) AS total_debt_amount,

                MIN(di.Fecha_Venc_Interes) AS oldest_due_date

            FROM Datos_ingreso di
            LEFT JOIN dbo.Datos_ingreso_interes_cache c
              ON di.Cod_Ingreso = c.Cod_Ingreso
            INNER JOIN clientes_validos cv
                ON di.CodCliente_Ingreso = cv.CodCliente_Ingreso
              AND di.ClaveCatastral = cv.ClaveCatastral

            WHERE di.Fecha_Pago IS NULL
              AND di.Estado_Ingreso IS NULL
              AND di.convenio IS NULL
              AND di.Fecha_Venc_Interes <= @Today

            GROUP BY
                di.CodCliente_Ingreso,
                di.ClaveCatastral,
                YEAR(di.Fecha_Venc_Interes)
        ),
        totales AS (
            SELECT
                COUNT(DISTINCT CodCliente_Ingreso) AS total_unique_clients,
                COUNT(DISTINCT ClaveCatastral)     AS total_unique_cadastral_keys
            FROM base
        )

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
            SUM(total_interest_calculated) AS total_interest_calculated,

            AVG(CAST(months_past_due AS DECIMAL(10,2))) AS avg_months_past_due,
            MAX(months_past_due) AS max_months_in_debt,
            MIN(months_past_due) AS min_months_in_debt,

            COUNT(DISTINCT CASE WHEN months_past_due >= 6 THEN b.CodCliente_Ingreso END)  AS clients_over_6_months,
            COUNT(DISTINCT CASE WHEN months_past_due >= 12 THEN b.CodCliente_Ingreso END) AS clients_over_1_year,

            MAX(DATEDIFF(DAY, oldest_due_date, @Today)) AS max_days_in_debt,

            CAST(AVG(CAST(total_debt_amount AS DECIMAL(18,2))) AS DECIMAL(18,2)) AS avg_debt_per_client

        FROM base b
        CROSS JOIN totales t

        GROUP BY
            b.[year],
            t.total_unique_clients,
            t.total_unique_cadastral_keys

        ORDER BY b.[year] DESC;
      `;

      const result =
        await this.sqlServerService.query<YearlyOverdueSummarySqlResult>(query);

      if (result.length === 0) {
        return [];
      }

      const response: YearlyOverdueSummaryResponse[] = result.map((item) =>
        SQLServerAccountingAdapter.fromYearlySummarySqlResultToYearlySummaryResponse(
          item,
        ),
      );

      return response;
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

        DECLARE @Today DATE = GETDATE();

        ;WITH clientes_validos AS (
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
        ),
        base AS (
            SELECT
                di.CodCliente_Ingreso,
                di.ClaveCatastral,
                YEAR(di.Fecha_Venc_Interes)     AS [year],
                MONTH(di.Fecha_Venc_Interes)    AS [month],
                DATENAME(MONTH, di.Fecha_Venc_Interes) AS month_name,

                COUNT(*) AS months_past_due,

                SUM(ISNULL(di.Valor_Titulo, 0))          AS total_epaa_value,
                SUM(ISNULL(di.ValorTerceros, 0))         AS total_terceros,
                SUM(ISNULL(di.tasa_basura, 0))           AS total_trash_rate,
                SUM(ISNULL(di.Recargo, 0))               AS total_surcharge,
                SUM(ISNULL(di.Recargo_old, 0))           AS total_old_surcharge,
                SUM(ISNULL(di.interes_mejoras, 0))       AS total_improvements_interest,
                SUM(ISNULL(c.interes_calculado, 0))      AS total_interest_calculated,

                SUM(
                    ISNULL(di.tasa_basura, 0)
                  + ISNULL(di.Valor_Titulo, 0)
                  + ISNULL(di.interes_mejoras, 0)
                  + ISNULL(di.Recargo, 0)
                  + ISNULL(c.interes_calculado, 0)
                ) AS total_debt_amount,

                MIN(di.Fecha_Venc_Interes) AS oldest_due_date

            FROM Datos_ingreso di
            LEFT JOIN dbo.Datos_ingreso_interes_cache c
              ON di.Cod_Ingreso = c.Cod_Ingreso
            INNER JOIN clientes_validos cv
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
                MONTH(di.Fecha_Venc_Interes),
                DATENAME(MONTH, di.Fecha_Venc_Interes)
        ),
        totales AS (
            SELECT
                COUNT(DISTINCT CodCliente_Ingreso) AS total_unique_clients,
                COUNT(DISTINCT ClaveCatastral)     AS total_unique_cadastral_keys
            FROM base
        )

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
            SUM(b.total_interest_calculated)     AS total_interest_calculated,

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

        FROM base b
        CROSS JOIN totales t

        GROUP BY
            b.[year],
            b.[month],
            b.month_name,
            t.total_unique_clients,
            t.total_unique_cadastral_keys

        ORDER BY b.[year] DESC, b.[month] DESC;
      `;

      const result =
        await this.sqlServerService.query<MonthlyDebtSummarySqlResult>(query);

      if (result.length === 0) {
        return [];
      }

      const response: MonthlyDebtSummaryResponse[] = result.map((item) =>
        SQLServerAccountingAdapter.fromMonthlySummarySqlResultToMonthlySummaryResponse(
          item,
        ),
      );

      return response;
    } catch (error) {
      throw error;
    }
  }
}
