import { Injectable } from '@nestjs/common';
import { SQLServerReadingAdapter } from '../adapters/sql-server.reading.adapter';
import {
  PendingReadingSQLResult,
  RangoTarifaSQLResult,
  ReadingSQLResult,
  TarifaSQLResult,
} from '../../../interfaces/reading.sql.response';
import { InterfaceReadingsRepository } from '../../../../domain/contracts/readings.interface.repository';
import { DatabaseServiceSQLServer2022 } from '../../../../../../shared/connections/database/sqlserver/sqlserver-2022.service';
import {
  PendingReadingResponse,
  ReadingResponse,
} from '../../../../domain/schemas/dto/response/readings.response';
import { ReadingModel } from '../../../../domain/schemas/model/sqlserver/reading.model';
import { FindCurrentReadingParams } from '../../../../domain/schemas/dto/request/find-current-reading.paramss';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../../settings/environments/status-code';

@Injectable()
export class ReadingSQLServer2022Persistence
  implements InterfaceReadingsRepository
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
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.Valor_Titulo     ELSE NULL END AS epaa_value,
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros    ELSE NULL END AS third_party_value,
            
            CASE WHEN l.LecturaActual IS NOT NULL 
                THEN COALESCE(di.Valor_Titulo, 0) + 
                      COALESCE(di.ValorTerceros, 0) + 
                      COALESCE(di.tasa_basura, 0) 
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
}
