import { Injectable } from '@nestjs/common';
import { SQLServerReadingAdapter } from '../adapters/sql-server.reading.adapter';
import {
  PaymentReadingSqlResponse,
  PaymentSqlResponse,
  PendingReadingSQLResult,
  RangoTarifaSQLResult,
  ReadingSQLResult,
  TarifaSQLResult,
} from '../../../interfaces/reading.sql.response';
import { InterfaceReadingsRepository } from '../../../../domain/contracts/readings.interface.repository';
import { DatabaseServiceSQLServer2022 } from '../../../../../../shared/connections/database/sqlserver/sqlserver-2022.service';
import {
  PaymentReadingResponse,
  PaymentResponse,
  PendingReadingResponse,
  ReadingResponse,
} from '../../../../domain/schemas/dto/response/readings.response';
import { ReadingModel } from '../../../../domain/schemas/model/sqlserver/reading.model';
import { FindCurrentReadingParams } from '../../../../domain/schemas/dto/request/find-current-reading.paramss';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../../settings/environments/status-code';
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
} from '../../../interfaces/entry-data.sql.response';
import { SQLServerEntryDataAdapter } from '../adapters/sql-server.entry-data.adapter';

@Injectable()
export class ReadingSQLServer2022Persistence
  implements InterfaceReadingsRepository, InterfaceEntryDataRepository
{
  constructor(
    private readonly sqlServerService: DatabaseServiceSQLServer2022,
  ) {}
  async createReading(reading: ReadingModel): Promise<ReadingResponse> {
    try {
      const query: string = `
      INSERT INTO AP_LECTURAS
      (
      Sector, Cuenta, Anio, Mes, LecturaAnterior, LecturaActual, CodigoIngresoARentas, Novedad, ValorAPagar, TasaAlcantarillado, Reconexion, FechaCaptura, HoraCaptura, ClaveCatastral
      )
      OUTPUT
      inserted.Sector       AS sector,
      inserted.Cuenta       AS account,
      inserted.Anio         AS year,
      inserted.Mes          AS month,
      inserted.LecturaAnterior AS previousReading,
      inserted.LecturaActual   AS currentReading,
      inserted.CodigoIngresoARentas AS rentalIncomeCode,
      inserted.Novedad      AS novelty,
      inserted.ValorAPagar  AS readingValue,
      inserted.TasaAlcantarillado AS sewerRate,
      inserted.Reconexion   AS reconnection,
      inserted.Cod_ingreso  AS incomeCode,
      inserted.FechaCaptura AS readingDate,
      inserted.HoraCaptura  AS readingTime,
      inserted.ClaveCatastral AS cadastralKey
      VALUES
      (
      @sector, @account, @year, @month, @previousReading, @currentReading, @rentalIncomeCode, @novelty, @readingValue, @sewerRate, @reconnection, @readingDate, @readingTime, @cadastralKey
      );
      `;
      const params: any[] = [
        { name: 'sector', value: reading.getSector() },
        { name: 'account', value: reading.getAccount() },
        { name: 'year', value: reading.getYear() },
        { name: 'month', value: reading.getMonth() },
        { name: 'previousReading', value: reading.getPreviousReading() },
        { name: 'currentReading', value: reading.getCurrentReading() },
        { name: 'rentalIncomeCode', value: reading.getRentalIncomeCode() },
        { name: 'novelty', value: reading.getNovelty() },
        { name: 'readingValue', value: reading.getReadingValue() },
        { name: 'sewerRate', value: reading.getSewerRate() },
        { name: 'reconnection', value: reading.getReconnection() },
        { name: 'cadastralKey', value: reading.getCadastralKey() },
        { name: 'readingDate', value: reading.getReadingDate() },
        { name: 'readingTime', value: reading.getReadingTime() },
        //{ name: 'incomeCode', value: reading.getIncomeCode() }
      ];
      const result: ReadingSQLResult[] =
        await this.sqlServerService.query<ReadingSQLResult>(query, params);
      return SQLServerReadingAdapter.toDomain(result[0]);
    } catch (error) {
      throw error;
    }
  }

  async findCurrentReading(
    params: FindCurrentReadingParams,
  ): Promise<ReadingResponse | null> {
    try {
      const query = `
      SELECT TOP 1
        Sector AS sector,
        Cuenta AS account,
        Anio AS year,
        Mes AS month,
        LecturaAnterior AS previousReading,
        LecturaActual AS currentReading,
        CodigoIngresoARentas AS rentalIncomeCode,
        Novedad AS novelty,
        ValorAPagar AS readingValue,
        TasaAlcantarillado AS sewerRate,
        Reconexion AS reconnection,
        Cod_ingreso AS incomeCode,
        FechaCaptura AS readingDate,
        HoraCaptura AS readingTime,
        ClaveCatastral AS cadastralKey
      FROM AP_LECTURAS
      WHERE Sector = ${Number(params.sector)}
        AND Cuenta = ${Number(params.account)}
        AND Anio = '${Number(params.year)}'
        AND Mes = '${String(params.month)}'
        AND LecturaAnterior = ${Number(params.previousReading)}
        --AND FechaCaptura IS NULL
      ORDER BY FechaCaptura DESC
    `;

      const result: ReadingSQLResult[] =
        await this.sqlServerService.query<ReadingSQLResult>(query);

      if (!result[0]) {
        return null;
      }

      return SQLServerReadingAdapter.toDomain(result[0]);
    } catch (error) {
      throw error;
    }
  }

  async updateCurrentReading(
    params: FindCurrentReadingParams,
    reading: ReadingModel,
  ): Promise<ReadingResponse> {
    try {
      console.log(
        'Received updateCurrentReading request in Persistence:',
        reading,
      );
      console.log(
        'Received updateCurrentReading params in Persistence:',
        params,
      );
      const query: string = `
      UPDATE AP_LECTURAS
      SET
        LecturaActual = @currentReading,
        Novedad = @novelty,
        --ValorAPagar = @readingValue,
        --TasaAlcantarillado = @sewerRate,
        --Reconexion = @reconnection,
        --FechaCaptura = @readingDate,
        --HoraCaptura = @readingTime,
        ClaveCatastral = @cadastralKey
      OUTPUT
        inserted.Sector       AS sector,
        inserted.Cuenta       AS account,
        inserted.Anio         AS year,
        inserted.Mes          AS month,
        inserted.LecturaAnterior AS previousReading,
        inserted.LecturaActual   AS currentReading,
        inserted.CodigoIngresoARentas AS rentalIncomeCode,
        inserted.Novedad      AS novelty,
        inserted.ValorAPagar  AS readingValue,
        inserted.TasaAlcantarillado AS sewerRate,
        inserted.Reconexion   AS reconnection,
        inserted.Cod_ingreso  AS incomeCode,
        inserted.FechaCaptura AS readingDate,
        inserted.HoraCaptura  AS readingTime,
        inserted.ClaveCatastral AS cadastralKey
      WHERE
        Sector = @sector AND Cuenta = @account --AND Cod_ingreso = @incomeCode
        AND Anio = @year AND Mes = @month AND LecturaAnterior = @previousReading AND FechaCaptura IS NULL;
      `;
      const queryParams: any[] = [
        {
          name: 'currentReading',
          value: Number(reading.getCurrentReading()) || 0,
        },
        { name: 'novelty', value: reading.getNovelty() },
        { name: 'readingValue', value: Number(reading.getReadingValue()) || 0 },
        { name: 'sewerRate', value: Number(reading.getSewerRate()) || 0 },
        { name: 'reconnection', value: Number(reading.getReconnection()) || 0 },
        { name: 'readingDate', value: reading.getReadingDate() },
        { name: 'readingTime', value: reading.getReadingTime() },
        { name: 'cadastralKey', value: reading.getCadastralKey() },
        { name: 'sector', value: Number(params.sector) },
        { name: 'account', value: Number(params.account) },
        { name: 'year', value: Number(params.year) },
        { name: 'month', value: params.month }, // string, ok
        { name: 'previousReading', value: Number(params.previousReading) || 0 },
      ];

      const updatedReading =
        await this.sqlServerService.query<ReadingSQLResult>(query, queryParams);

      console.log('Updated reading result:', updatedReading);

      if (!updatedReading) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve updated reading 1',
        });
      }

      if (!updatedReading[0]) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve updated reading 2',
        });
      }

      return SQLServerReadingAdapter.toDomain(updatedReading[0]);
    } catch (error) {
      throw error;
    }
  }

  async calculateReadingValue(
    cadastralKey: string,
    consumptionM3: number,
  ): Promise<number> {
    try {
      const vSector = cadastralKey.split('-')[0];
      const vCuenta = cadastralKey.split('-')[1];

      // 1. Obtener la tarifa de la acometida
      const queryAcometida = `
      SELECT "Tarifa"
      FROM "AP_ACOMETIDAS"
      WHERE "Cuenta" = @account AND "Sector" = @sector
    `;

      const queryParams: any[] = [
        {
          name: 'sector',
          value: vSector,
        },
        {
          name: 'account',
          value: vCuenta,
        },
      ];

      const resultAcometida =
        await this.sqlServerService.query<TarifaSQLResult>(
          queryAcometida,
          queryParams,
        );

      if (resultAcometida.length === 0) {
        console.warn(
          `No se encontró acometida para cuenta: ${vCuenta} - sector: ${vSector}`,
        );
        return 0;
      }

      const tarifa: string = resultAcometida[0].Tarifa.trim();

      // 2. Obtener los rangos de tarifas
      const queryTarifas = `
      SELECT "Minimo", "Maximo", "Base", "Adicional"
      FROM "AP_TARIFAS"
      WHERE "Nombre" = @tarifa
      ORDER BY "Minimo" ASC
    `;

      const queryParamsTarifas: any[] = [
        {
          name: 'tarifa',
          value: tarifa,
        },
      ];

      const resultTarifas =
        await this.sqlServerService.query<RangoTarifaSQLResult>(
          queryTarifas,
          queryParamsTarifas,
        );

      if (resultTarifas.length === 0) {
        console.warn(`No se encontraron rangos para la tarifa: ${tarifa}`);
        return 0;
      }

      let min = 0;
      let max = 0;
      let bas = 0;
      let adic = 0;
      let bMinimo = 0;
      let bMaximo = 0;

      // Tomamos el primer y último para mensajes de error
      bMinimo = resultTarifas[0].Minimo;
      bMaximo = resultTarifas[resultTarifas.length - 1].Maximo;

      // Buscar el rango correspondiente
      for (const row of resultTarifas) {
        const minimo = Number(row.Minimo);
        const maximo = Number(row.Maximo);

        if (consumptionM3 >= minimo && consumptionM3 <= maximo) {
          min = minimo;
          max = maximo;
          bas = Number(row.Base);
          adic = Number(row.Adicional);
          break; // encontrado → salimos
        }
      }

      // Si no encontró ningún rango válido
      if (bas === 0) {
        console.warn(
          `Consumo ${consumptionM3} m³ fuera de rango para cuenta '${vCuenta.trim()}' ` +
            `sector '${vSector.trim()}' - Tarifa '${tarifa}'. ` +
            `Rango permitido: ${bMinimo} a ${bMaximo} m³. Consulte el pliego tarifario.`,
        );
        // Aquí podrías lanzar un error o mostrar un mensaje en UI
        // alert(...) si estás en frontend, pero como es función, retornamos 0
        return 0;
      }

      // Cálculo final
      let valorPagar: number;

      if (consumptionM3 >= 0 && consumptionM3 <= 10) {
        valorPagar = bas;
      } else {
        // valor base + adicional por m³ extras (a partir de min - 1)
        const m3Adicionales = consumptionM3 - (min - 1);
        valorPagar = bas + m3Adicionales * adic;
      }

      return valorPagar;
    } catch (error) {
      console.error('Error al calcular ValorPagarConsumo:', error);
      throw error; // o retornar 0 según tu política
    }
  }

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
            (COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.tasa_basura, 0)) AS total,
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
        SQLServerReadingAdapter.toDomainPending(reading),
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
            (COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.tasa_basura, 0)) AS total,
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
        SQLServerReadingAdapter.toDomainPending(reading),
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
            c.CED_IDENT_CIUDADANO           AS card_id,
            c.NOMBRES_CIUDADANO             AS name,
            c.APELLIDOS_CIUDADANO           AS last_name,
            di.ClaveCatastral               AS cadastral_key,
            di.Direccion                    AS address,
            a.Tarifa                        AS rate,

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
                ELSE NULL
            END                             AS total_epaa_value,

            -- ── Tasa de recolección de basura ─────────────────────────────────────────────
            -- Tarifa de basura aplicada en este período
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura     ELSE NULL END AS trash_rate,
            -- Tarifa oficial del período anterior (para calcular saldo)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura_anterior_oficial ELSE NULL END AS trash_rate_previous,
            -- Saldo a favor: la tarifa bajó, el cliente pagó de más antes → se descuenta
            CASE WHEN l.LecturaActual IS NOT NULL AND di.tasa_basura_anterior_oficial > 0 AND di.tasa_basura_anterior_oficial > di.tasa_basura
                THEN (di.tasa_basura_anterior_oficial - di.tasa_basura)
                ELSE NULL
            END                             AS balance_in_favor,
            -- Saldo en contra: la tarifa subió, el cliente pagó de menos antes → se cobra
            CASE WHEN l.LecturaActual IS NOT NULL AND di.tasa_basura_anterior_oficial > 0 AND di.tasa_basura_anterior_oficial < di.tasa_basura
                THEN (di.tasa_basura - di.tasa_basura_anterior_oficial)
                ELSE NULL
            END                             AS balance_against,
            -- Descuento aplicado sobre la tasa de basura (solo en registros pagados, aquí siempre 0)
            COALESCE(di.descuento_tb, 0)    AS discount_trash_rate,
            -- Total neto de basura = tasa actual + ajuste por cambio de tarifa (favor o contra)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.tasa_basura, 0)
                   + CASE WHEN di.tasa_basura_anterior_oficial > 0 AND di.tasa_basura_anterior_oficial < di.tasa_basura THEN (di.tasa_basura - di.tasa_basura_anterior_oficial) ELSE 0 END
                   - CASE WHEN di.tasa_basura_anterior_oficial > 0 AND di.tasa_basura_anterior_oficial > di.tasa_basura THEN (di.tasa_basura_anterior_oficial - di.tasa_basura) ELSE 0 END
                ELSE NULL
            END                             AS total_trash_rate,

            -- ── Totales de la planilla ────────────────────────────────────────────────────
            -- Total base: EPAA + terceros + basura actual + recargo (sin ajuste de tarifa)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                   + COALESCE(di.ValorTerceros, 0)
                   + COALESCE(di.tasa_basura, 0)
                   + COALESCE(di.Recargo, 0)
                -- descuento_tb no aplica: solo existe en registros pagados (Fecha_Pago IS NOT NULL)
                ELSE NULL
            END                             AS total,

            -- Total ajustado: incorpora el saldo a favor/contra por cambio de tarifa de basura
            --   Tarifa bajó (anterior > actual) → saldo a favor del cliente → resta diferencia
            --   Tarifa subió (actual > anterior) → saldo en contra del cliente → suma diferencia
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                   + COALESCE(di.ValorTerceros, 0)
                   + COALESCE(di.tasa_basura, 0)
                   + COALESCE(di.Recargo, 0)
                   + CASE WHEN di.tasa_basura_anterior_oficial > 0 AND di.tasa_basura_anterior_oficial < di.tasa_basura THEN (di.tasa_basura - di.tasa_basura_anterior_oficial) ELSE 0 END
                   - CASE WHEN di.tasa_basura_anterior_oficial > 0 AND di.tasa_basura_anterior_oficial > di.tasa_basura THEN (di.tasa_basura_anterior_oficial - di.tasa_basura) ELSE 0 END
                -- descuento_tb no aplica: solo existe en registros pagados (Fecha_Pago IS NOT NULL)
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

      console.log(result);

      const pendingReadings = result.map((reading) =>
        SQLServerReadingAdapter.toDomainPending(reading),
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
        SQLServerReadingAdapter.fromPaymentSqlResponseToPaymentResponse(item),
      );

      if (response.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Payments not found for the given date: ${paymentDate} and order value: ${orderValue}`,
        });
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
                     -- sin límite de longitud aquí para probar
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
          --AND di.convenio   IS NULL
          --AND di.Estado_Ingreso IS NOT NULL

      ORDER BY
          di.ClaveCatastral,
          di.Fecha_Ingreso DESC;
      `;
      const result =
        await this.sqlServerService.query<PaymentReadingSqlResponse>(query);

      const response: PaymentReadingResponse[] = result.map((item) =>
        SQLServerReadingAdapter.fromPaymentReadingSqlResponseToPaymentReadingResponse(
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
        SQLServerReadingAdapter.fromPaymentSqlResponseToPaymentResponse(item),
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
        SQLServerReadingAdapter.fromPaymentSqlResponseToPaymentResponse(item),
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

  async getDailyCollectorSummary(
    params: DateRangeParams,
  ): Promise<DailyCollectorSummary[]> {
    try {
      // Normalize ISO 8601 to 'YYYY-MM-DD HH:MM:SS.mmm' (compatible with SS 2000 & 2022)
      const initDate = params.startDate
        .replace('T', ' ')
        .replace('Z', '')
        .split('.')[0];
      const endDate = params.endDate.split('T')[0] + ' 23:59:59.997';
      const query = `
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
            COALESCE(d.detail_value, 0)                    AS detail_value,
            CASE
                WHEN ABS(i.title_value - COALESCE(d.detail_value, 0)) < 0.01
                THEN 'OK'
                ELSE 'DIFERENCIA'
            END                                            AS validate,
            ROUND(i.title_value - COALESCE(d.detail_value, 0), 2) AS difference
        FROM (
            SELECT
                CONVERT(VARCHAR(10), Fecha_Pago, 120)      AS date,
                User_Cobro                                 AS collector,
                SUM(
                    COALESCE(Valor_Titulo,  0) +
                    COALESCE(ValorTerceros, 0) +
                    COALESCE(Recargo,       0) +
                    COALESCE(tasa_basura,   0) -
                    COALESCE(descuento_tb,  0)
                )                                          AS total_collected,
                COUNT(Cod_Ingreso)                         AS payment_count,
                SUM(COALESCE(Valor_Titulo,  0))            AS title_value,
                SUM(COALESCE(ValorTerceros, 0))            AS third_party_value,
                SUM(COALESCE(Recargo,       0))            AS surcharge_value,
                SUM(COALESCE(tasa_basura,   0))            AS trash_rate_value,
                SUM(COALESCE(descuento_tb,  0))            AS discount_trash_rate_value
            FROM Datos_ingreso
            WHERE Fecha_Pago >= CONVERT(DATETIME, '${initDate}', 120)
              AND Fecha_Pago <= CONVERT(DATETIME, '${endDate}',  120)
            GROUP BY
                CONVERT(VARCHAR(10), Fecha_Pago, 120),
                User_Cobro
        ) i
        LEFT JOIN (
            SELECT
                CONVERT(VARCHAR(10), di.Fecha_Pago, 120)  AS date,
                di.User_Cobro                             AS collector,
                SUM(COALESCE(v.Valor, 0))                 AS detail_value
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
            i.total_collected DESC
    `;
      const result =
        await this.sqlServerService.query<DailyCollectorSummarySQLResult>(
          query,
        );

      const response: DailyCollectorSummary[] = result.map((item) =>
        SQLServerEntryDataAdapter.toDomainDailyCollectorSummary(item),
      );

      return response;
    } catch (error) {
      console.error('Error al buscar el resumen diario de cobradores:', error);
      throw error;
    }
  }

  async getDailyGroupedReport(
    params: DateRangeParams,
  ): Promise<DailyGroupedReport[]> {
    try {
      // Normalize ISO 8601 to 'YYYY-MM-DD HH:MM:SS.mmm' (compatible with SS 2000 & 2022)
      const initDate = params.startDate
        .replace('T', ' ')
        .replace('Z', '')
        .split('.')[0];
      const endDate = params.endDate.split('T')[0] + ' 23:59:59.997';
      const query = `
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
            COALESCE(d.detail_value, 0)                    AS detail_value,
            CASE
                WHEN ABS(i.title_value - COALESCE(d.detail_value, 0)) < 0.01
                THEN 'OK'
                ELSE 'DIFERENCIA'
            END                                            AS validate,
            ROUND(i.title_value - COALESCE(d.detail_value, 0), 2) AS difference
        FROM (
            SELECT
                CONVERT(VARCHAR(8),  Fecha_Pago, 112)      AS day,
                CONVERT(VARCHAR(10), Fecha_Pago, 120)      AS date,
                User_Cobro                                 AS collector,
                Cod_Titulo_Datos                           AS title_code,
                FormaDePago                                AS payment_method,
                Estado_Ingreso                             AS status,
                SUM(COALESCE(Valor_Titulo,  0))            AS title_value,
                SUM(COALESCE(ValorTerceros, 0))            AS third_party_value,
                SUM(COALESCE(Recargo,       0))            AS surcharge_value,
                SUM(COALESCE(tasa_basura,   0))            AS trash_rate_value,
                SUM(COALESCE(descuento_tb,  0))              AS discount_trash_rate_value,
                SUM(
                    COALESCE(Valor_Titulo,  0) +
                    COALESCE(ValorTerceros, 0) +
                    COALESCE(Recargo,       0) +
                    COALESCE(tasa_basura,   0) -
                    COALESCE(descuento_tb,  0)
                )                                          AS total_value,
                COUNT(Cod_Ingreso)                         AS record_count
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
                CONVERT(VARCHAR(8),  di.Fecha_Pago, 112)  AS day,
                di.User_Cobro                             AS collector,
                di.Cod_Titulo_Datos                       AS title_code,
                di.FormaDePago                            AS payment_method,
                di.Estado_Ingreso                         AS status,
                SUM(COALESCE(v.Valor, 0))                 AS detail_value
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

      const response: DailyGroupedReport[] = result.map((item) =>
        SQLServerEntryDataAdapter.toDomainDailyGroupedReport(item),
      );

      return response;
    } catch (error) {
      console.error('Error al buscar el resumen diario de cobradores:', error);
      throw error;
    }
  }

  async getDailyPaymentMethodReport(
    params: DateRangeParams,
  ): Promise<DailyPaymentMethodReport[]> {
    try {
      // Normalize ISO 8601 to 'YYYY-MM-DD HH:MM:SS.mmm' (compatible with SS 2000 & 2022)
      const initDate = params.startDate
        .replace('T', ' ')
        .replace('Z', '')
        .split('.')[0];
      const endDate = params.endDate.split('T')[0] + ' 23:59:59.997';
      const query = `
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
            COALESCE(d.detail_value, 0)                    AS detail_value,
            CASE
                WHEN ABS(i.title_value - COALESCE(d.detail_value, 0)) < 0.01
                THEN 'OK'
                ELSE 'DIFERENCIA'
            END                                            AS validate,
            ROUND(i.title_value - COALESCE(d.detail_value, 0), 2) AS difference
        FROM (
            SELECT
                CONVERT(VARCHAR(10), Fecha_Pago, 120)      AS date,
                FormaDePago                                AS payment_method,
                Estado_Ingreso                             AS status,
                SUM(
                    COALESCE(Valor_Titulo,  0) +
                    COALESCE(ValorTerceros, 0) +
                    COALESCE(Recargo,       0) +
                    COALESCE(tasa_basura,   0) -
                    COALESCE(descuento_tb,  0)
                )                                          AS total,
                COUNT(Cod_Ingreso)                         AS record_count,
                SUM(COALESCE(Valor_Titulo,  0))            AS title_value,
                SUM(COALESCE(ValorTerceros, 0))            AS third_party_value,
                SUM(COALESCE(Recargo,       0))            AS surcharge_value,
                SUM(COALESCE(tasa_basura,   0))            AS trash_rate_value,
                SUM(COALESCE(descuento_tb,  0))            AS discount_trash_rate_value
            FROM Datos_ingreso
            WHERE Fecha_Pago >= CONVERT(DATETIME, '${initDate}', 120)
              AND Fecha_Pago <= CONVERT(DATETIME, '${endDate}',  120)
            GROUP BY
                CONVERT(VARCHAR(10), Fecha_Pago, 120),
                FormaDePago, Estado_Ingreso
        ) i
        LEFT JOIN (
            SELECT
                CONVERT(VARCHAR(10), di.Fecha_Pago, 120)  AS date,
                di.FormaDePago                            AS payment_method,
                di.Estado_Ingreso                         AS status,
                SUM(COALESCE(v.Valor, 0))                 AS detail_value
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

      const response: DailyPaymentMethodReport[] = result.map((item) =>
        SQLServerEntryDataAdapter.toDomainDailyPaymentMethodReport(item),
      );

      return response;
    } catch (error) {
      console.error('Error al buscar el resumen diario de cobradores:', error);
      throw error;
    }
  }

  async getFullBreakdownReport(
    params: DateRangeParams,
  ): Promise<FullBreakdownReport[]> {
    try {
      // Normalize ISO 8601 to 'YYYY-MM-DD HH:MM:SS.mmm' (compatible with SS 2000 & 2022)
      const initDate = params.startDate
        .replace('T', ' ')
        .replace('Z', '')
        .split('.')[0];
      const endDate = params.endDate.split('T')[0] + ' 23:59:59.997';
      const query = `
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
            COALESCE(d.detail_value, 0)                    AS detail_value,
            CASE
                WHEN ABS(i.title_value - COALESCE(d.detail_value, 0)) < 0.01
                THEN 'OK'
                ELSE 'DIFERENCIA'
            END                                            AS validate,
            ROUND(i.title_value - COALESCE(d.detail_value, 0), 2) AS difference
        FROM (
            SELECT
                CONVERT(VARCHAR(10), Fecha_Pago, 120)      AS date,
                User_Cobro                                 AS collector,
                Cod_Titulo_Datos                           AS title_code,
                FormaDePago                                AS payment_method,
                Estado_Ingreso                             AS status,
                SUM(COALESCE(Valor_Titulo,  0))            AS title_value,
                SUM(COALESCE(ValorTerceros, 0))            AS third_party_value,
                SUM(COALESCE(Recargo,       0))            AS surcharge_value,
                SUM(COALESCE(tasa_basura,   0))            AS trash_rate_value,
                SUM(COALESCE(descuento_tb,  0))              AS discount_trash_rate_value,
                SUM(
                    COALESCE(Valor_Titulo,  0) +
                    COALESCE(ValorTerceros, 0) +
                    COALESCE(Recargo,       0) +
                    COALESCE(tasa_basura,   0) -
                    COALESCE(descuento_tb,  0)
                )                                          AS grand_total,
                COUNT(DISTINCT Cod_Ingreso)                AS income_count
            FROM Datos_ingreso
            WHERE Fecha_Pago >= CONVERT(DATETIME, '${initDate}', 120)
              AND Fecha_Pago <= CONVERT(DATETIME, '${endDate}',  120)
            GROUP BY
                CONVERT(VARCHAR(10), Fecha_Pago, 120),
                User_Cobro, Cod_Titulo_Datos, FormaDePago, Estado_Ingreso
        ) i
        LEFT JOIN (
            SELECT
                CONVERT(VARCHAR(10), di.Fecha_Pago, 120)  AS date,
                di.User_Cobro                             AS collector,
                di.Cod_Titulo_Datos                       AS title_code,
                di.FormaDePago                            AS payment_method,
                di.Estado_Ingreso                         AS status,
                SUM(COALESCE(v.Valor, 0))                 AS detail_value
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

      const response: FullBreakdownReport[] = result.map((item) =>
        SQLServerEntryDataAdapter.toDomainFullBreakdownReport(item),
      );

      return response;
    } catch (error) {
      console.error('Error al buscar el resumen diario de cobradores:', error);
      throw error;
    }
  }
}
