import { Injectable } from '@nestjs/common';
import { SQLServerReadingAdapter } from '../adapters/sql-server.reading.adapter';
import {
  ReadingSQL2000Result,
  ReadingSQLResult,
  RangoTarifaSQLResult,
  TarifaSQLResult,
  PendingReadingSQLResult,
  PaymentReadingSqlResponse,
  PaymentSqlResponse,
  OverduePaymentSqlResponse,
  OverdueSummarySqlResult,
  YearlyOverdueSummarySqlResult,
} from '../../../interfaces/reading.sql.response';
import { InterfaceReadingsRepository } from '../../../../domain/contracts/readings.interface.repository';
import { DatabaseServiceSQLServer2000 } from '../../../../../../shared/connections/database/sqlserver/sqlserver-2000.service';
import { ReadingModel } from '../../../../domain/schemas/model/sqlserver/reading.model';
import {
  OverduePaymentResponse,
  OverdueSummaryResponse,
  PaymentReadingResponse,
  PaymentResponse,
  PendingReadingResponse,
  ReadingResponse,
  YearlyOverdueSummaryResponse,
} from '../../../../domain/schemas/dto/response/readings.response';
import { formatDateForSQLServer } from '../../../../../../shared/utils/format-date';
import { FindCurrentReadingParams } from '../../../../domain/schemas/dto/request/find-current-reading.paramss';
import { MONTHS, MONTHS_REVERSE } from '../../../../../../shared/consts/months';
import { statusCode } from '../../../../../../settings/environments/status-code';
import { RpcException } from '@nestjs/microservices';
import { InterfaceEntryDataRepository } from '../../../../domain/contracts/entry-data.interface.repository';
import {
  DailyCollectorSummarySQLResult,
  DailyGroupedReportSQLResult,
  DailyPaymentMethodReportSQLResult,
  FullBreakdownReportSQLResult,
} from '../../../interfaces/entry-data.sql.response';
import {
  DailyCollectorSummary,
  DailyGroupedReport,
  DailyPaymentMethodReport,
  DateRangeParams,
  FullBreakdownReport,
} from '../../../../domain/schemas/dto/response/entry-data.response';
import { SQLServerEntryDataAdapter } from '../adapters/sql-server.entry-data.adapter';

class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

@Injectable()
export class ReadingSQLServer2000Persistence
  implements InterfaceReadingsRepository, InterfaceEntryDataRepository
{
  constructor(
    private readonly sqlServerService: DatabaseServiceSQLServer2000,
  ) {}

  private validateReading(reading: ReadingModel): void {
    const requiredFields = [
      {
        name: 'sector',
        value: reading.getSector(),
        type: 'number',
        maxLength: null,
      },
      {
        name: 'account',
        value: reading.getAccount(),
        type: 'number',
        maxLength: null,
      },
      {
        name: 'year',
        value: reading.getYear(),
        type: 'number',
        maxLength: null,
      },
      {
        name: 'month',
        value: reading.getMonth(),
        type: 'string',
        maxLength: 40,
      },
      {
        name: 'previousReading',
        value: reading.getPreviousReading(),
        type: 'number',
        maxLength: null,
      },
      {
        name: 'currentReading',
        value: reading.getCurrentReading(),
        type: 'number',
        maxLength: null,
      },
      {
        name: 'cadastralKey',
        value: reading.getCadastralKey(),
        type: 'string',
        maxLength: 15,
      },
      {
        name: 'novelty',
        value: reading.getNovelty(),
        type: 'string',
        maxLength: 100,
      },
      {
        name: 'rentalIncomeCode',
        value: reading.getRentalIncomeCode(),
        type: 'number',
        maxLength: null,
      },
      {
        name: 'readingValue',
        value: reading.getReadingValue(),
        type: 'number',
        maxLength: null,
      },
      {
        name: 'readingTime',
        value: reading.getReadingTime(),
        type: 'string',
        maxLength: 50,
      },
    ];

    for (const field of requiredFields) {
      if (field.value === null || field.value === undefined) {
        throw new DatabaseError(`Missing required field: ${field.name}`);
      }
      if (field.type === 'number') {
        if (typeof field.value !== 'number' || isNaN(field.value)) {
          throw new DatabaseError(
            `Invalid type for ${field.name}: expected number, got ${typeof field.value}`,
          );
        }
      }
      if (field.type === 'string') {
        if (typeof field.value !== 'string') {
          throw new DatabaseError(
            `Invalid type for ${field.name}: expected string, got ${typeof field.value}`,
          );
        }
        if (field.maxLength && field.value.length > field.maxLength) {
          throw new DatabaseError(
            `Field ${field.name} exceeds maximum length of ${field.maxLength}: ${field.value}`,
          );
        }
      }
    }

    const readingDate = reading.getReadingDate();
    if (readingDate === null || readingDate === undefined) {
      throw new DatabaseError('Missing required field: readingDate');
    }
    const date = new Date(readingDate);
    if (isNaN(date.getTime())) {
      throw new DatabaseError(`Invalid readingDate format: ${readingDate}`);
    }
  }

  async createReading(reading: ReadingModel): Promise<ReadingResponse> {
    let lastQuery: string | undefined = undefined;
    try {
      this.validateReading(reading);
      return await this.sqlServerService.transaction<ReadingResponse>(
        async (conn) => {
          const formattedDate = formatDateForSQLServer(
            reading.getReadingDate(),
          ).replace(/-/g, ''); // YYYYMMDD HH:mm:ss
          const insertQuery = `INSERT INTO AP_LECTURAS (Sector, Cuenta, Anio, Mes, LecturaAnterior, LecturaActual, Novedad, TasaAlcantarillado, Reconexion, FechaCaptura, HoraCaptura, ClaveCatastral) VALUES (${Number(reading.getSector())}, ${Number(reading.getAccount())}, '${String(reading.getYear())}', '${String(reading.getMonth())}', ${Number(reading.getPreviousReading())}, ${Number(reading.getCurrentReading())}, '${String(reading.getNovelty())}', ${reading.getSewerRate() != null ? parseFloat(reading.getSewerRate()?.toFixed(8)!) : 'NULL'}, ${reading.getReconnection() != null ? parseFloat(reading.getReconnection()?.toFixed(8)!) : 'NULL'}, '${formattedDate}', '${String(reading.getReadingTime())}', '${String(reading.getCadastralKey())}')`;

          lastQuery = insertQuery;
          console.log('Executing Insert Query:', lastQuery);

          const inserted = await conn.query(insertQuery);

          const selectQuery = `
          SELECT TOP 1
            Sector AS sector,
            Cuenta AS account,
            Anio AS year,
            Mes AS month,
            LecturaAnterior AS previousReading,
            LecturaActual AS currentReading,
            -- CodigoIngresoARentas AS rentalIncomeCode,
            Novedad AS novelty,
            ValorAPagar AS readingValue,
            TasaAlcantarillado AS sewerRate,
            Reconexion AS reconnection,
            Cod_ingreso AS incomeCode,
            FechaCaptura AS readingDate,
            HoraCaptura AS readingTime,
            ClaveCatastral AS cadastralKey
          FROM AP_LECTURAS
          WHERE Sector = ${Number(reading.getSector())} 
          AND Cuenta = ${Number(reading.getAccount())}
          ORDER BY FechaCaptura DESC
        `;
          lastQuery = selectQuery;
          //const selectParams = [reading.getSector(), reading.getAccount()];
          const selectResult: ReadingSQL2000Result[] =
            await conn.query<ReadingSQL2000Result>(selectQuery);

          if (!selectResult[0]) {
            throw new DatabaseError('Failed to retrieve inserted reading');
          }

          console.log(
            `Successfully created reading for sector ${reading.getSector()}, account ${reading.getAccount()}`,
          );
          return SQLServerReadingAdapter.toDomain2000(selectResult[0]);
        },
      );
    } catch (error: any) {
      console.error(`Failed to create reading: ${error.message}`, {
        error,
        lastQuery,
      });
      throw new DatabaseError(
        `Failed to create reading: ${error.message}`,
        error.code,
      );
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
        AND FechaCaptura IS NULL
      ORDER BY FechaCaptura DESC
    `;

      const result: ReadingSQL2000Result[] =
        await this.sqlServerService.query<ReadingSQL2000Result>(query);

      if (result.length === 0) {
        return null;
      }

      return SQLServerReadingAdapter.toDomain2000(result[0]);
    } catch (error) {
      throw error;
    }
  }

  async updateCurrentReading(
    params: FindCurrentReadingParams,
    reading: ReadingModel,
  ): Promise<ReadingResponse> {
    let lastQuery: string | undefined = undefined;
    try {
      return await this.sqlServerService.transaction<ReadingResponse>(
        async (conn) => {
          const updateQuery = `
          UPDATE AP_LECTURAS
          SET
            LecturaActual = ${Number(reading.getCurrentReading())},
            Novedad = '${String(reading.getNovelty() || '')}',
            --ValorAPagar = ${reading.getReadingValue() != null ? Number(reading.getReadingValue()) : null},
            --TasaAlcantarillado = ${reading.getSewerRate() != null ? Number(reading.getSewerRate()) : null},
            --Reconexion = ${reading.getReconnection() != null ? Number(reading.getReconnection()) : null},
            --FechaCaptura = '${formatDateForSQLServer(reading.getReadingDate())}',
            --HoraCaptura = '${String(reading.getReadingTime() || '')}',
            ClaveCatastral = '${String(reading.getCadastralKey() || '')}'
            -- Es el numero del mes la siguiente actualizacion
            --LecturaSugerida = ${Number(MONTHS_REVERSE[String(reading.getMonth())])} -- numero de mes actual de lectura
          WHERE
            Sector = ${Number(params.sector)}
            AND Cuenta = ${Number(params.account)}
            AND Anio = '${Number(params.year)}'
            AND Mes = '${String(params.month)}'
            AND LecturaAnterior = ${Number(params.previousReading)}
            --AND FechaCaptura IS NULL
        `;

          //console.log('Here AM i Last Query: ', updateQuery);

          lastQuery = updateQuery;
          const updateResult = await conn.query(updateQuery);

          console.log('Here AM i: ', lastQuery, updateResult);
          /*
          if (updateResult.length === 0) {
            throw new DatabaseError(
              'No reading found to update (or already captured)',
            );
          }
            */

          // 2. SELECT del registro recién actualizado
          const selectQuery = `
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
          ORDER BY FechaCaptura DESC
        `;

          lastQuery = selectQuery;
          const selectResult: ReadingSQL2000Result[] =
            await conn.query<ReadingSQL2000Result>(selectQuery);

          if (!selectResult || selectResult.length === 0) {
            throw new DatabaseError('Failed to retrieve updated reading');
          }

          return SQLServerReadingAdapter.toDomain2000(selectResult[0]);
        },
      );
    } catch (error: any) {
      console.error(`Failed to update reading: ${error.message}`, {
        error,
        lastQuery,
      });
      throw new DatabaseError(
        `Failed to update reading: ${error.message}`,
        error.code,
      );
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
      SELECT Tarifa
      FROM AP_ACOMETIDAS
      WHERE Cuenta = ${Number(vCuenta)} AND Sector = ${Number(vSector)}
    `;

      const resultAcometida =
        await this.sqlServerService.query<TarifaSQLResult>(queryAcometida);

      if (!resultAcometida || resultAcometida.length === 0) {
        console.warn(
          `No se encontró acometida para cuenta: ${vCuenta} - sector: ${vSector}`,
        );
        return 0;
      }

      const tarifa: string = resultAcometida[0].Tarifa.trim();

      // 2. Obtener los rangos de tarifas
      const queryTarifas = `
      SELECT Minimo, Maximo, Base, Adicional
      FROM AP_TARIFAS
      WHERE Nombre = '${String(tarifa)}'
      ORDER BY Minimo ASC
    `;

      const resultTarifas =
        await this.sqlServerService.query<RangoTarifaSQLResult>(queryTarifas);

      if (!resultTarifas || resultTarifas.length === 0) {
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

      //await this.sqlServerService.query(`SET NOCOUNT OFF;`);
      //await this.sqlServerService.close();
      return result.map(SQLServerReadingAdapter.toDomainPending);
    } catch (error) {
      console.error('Error al obtener lecturas pendientes:', error);
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

      //await this.sqlServerService.query(`SET NOCOUNT OFF;`);
      //await this.sqlServerService.close();

      return result.map(SQLServerReadingAdapter.toDomainPending);
    } catch (error) {
      console.error('Error al obtener lecturas pendientes:', error);
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
                -- descuento_tb no aplica: solo existe en registros pagados (Fecha_Pago IS NOT NULL)
                ELSE NULL
            END                             AS total,

            -- Total ajustado: Total consolidado del cliente
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                   + COALESCE(di.ValorTerceros, 0)
                   + COALESCE(di.Recargo, 0)
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

      //await this.sqlServerService.query(`SET NOCOUNT OFF;`);
      //await this.sqlServerService.close();

      return result.map(SQLServerReadingAdapter.toDomainPending);
    } catch (error) {
      console.error(
        'Error al obtener lecturas pendientes por clave catastral o número de tarjeta:',
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
          
        DECLARE @searchParam VARCHAR(50)  
        SET @searchParam = '${String(searchValue.trim())}';  
          
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
            + COALESCE(di.Recargo, 0)       AS total,  
          
            COALESCE(di.Valor_Titulo, 0)  
            + COALESCE(di.ValorTerceros, 0)  
            + COALESCE(di.Recargo, 0)  
            + CASE  
                WHEN COALESCE(anc.Valor, 0) > 0 THEN  
                    CASE  
                        WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0  
                        ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor  
                    END  
                ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)  
              END                           AS adjusted_total,  
          
            di.Estado_Ingreso               AS income_status,  
            di.Fecha_Ingreso                AS income_date  
          
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

      const result =
        await this.sqlServerService.query<PendingReadingSQLResult>(query);

      //await this.sqlServerService.query(`SET NOCOUNT OFF;`);
      //await this.sqlServerService.close();

      return result.map(SQLServerReadingAdapter.toDomainPending);
    } catch (error) {
      console.error(
        'Error al obtener lecturas pendientes por clave catastral o número de tarjeta:',
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
    END AS hasConnection
    `;

      const result = await this.sqlServerService.query<{
        hasConnection: number;
      }>(query);
      return result.length > 0 && result[0].hasConnection === 1;
    } catch (error) {
      console.error('Error al verificar existencia de lectura:', error);
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
        Number.isInteger(limit) && limit! > 0 ? limit! : 2147483647;

      // SQL Server 2000 does not support OFFSET ... FETCH NEXT.
      // Pagination is achieved via the TOP + NOT IN subquery pattern.
      // Inner subquery selects the first @offset Cod_Ingreso values ordered by
      // Fecha_Ingreso DESC; the outer query skips those and takes the next @limit rows.
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
      // Normalize ISO 8601 → 'YYYY-MM-DD HH:MM:SS' (SQL Server 2000 compatible)
      const initDate = params.startDate
        .replace('T', ' ')
        .replace('Z', '')
        .split('.')[0];
      // Example Date init: 2026-03-01 00:00:00
      // Example Date init: 2026-03-01 23:59:59.997
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
      // Normalize ISO 8601 → 'YYYY-MM-DD HH:MM:SS' (SQL Server 2000 compatible)
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
      // Normalize ISO 8601 → 'YYYY-MM-DD HH:MM:SS' (SQL Server 2000 compatible)
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
      // Normalize ISO 8601 → 'YYYY-MM-DD HH:MM:SS' (SQL Server 2000 compatible)
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

      const response: FullBreakdownReport[] = result.map((item) =>
        SQLServerEntryDataAdapter.toDomainFullBreakdownReport(item),
      );

      return response;
    } catch (error) {
      console.error('Error al buscar el resumen diario de cobradores:', error);
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

      -- Tabla temporal con exactamente tu consulta original
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
        --AND di.Cod_Titulo_Datos = 'AGP'     -- descomenta solo si lo necesitas

      GROUP BY di.ClaveCatastral, di.CodCliente_Ingreso
      HAVING COUNT(di.Cod_Ingreso) > 1;

      -- Retornar solo la página solicitada
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
        SQLServerReadingAdapter.fromOverduePaymentSqlResponseToOverduePaymentResponse(
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

        DECLARE @Corte DATETIME;
        SET @Corte = GETDATE();

        SELECT
            COUNT(DISTINCT CodCliente_Ingreso) AS total_clients_with_debt, -- ✅ CORRECTO
            COUNT(DISTINCT ClaveCatastral)     AS total_unique_cadastral_keys, -- ✅ CORRECTO

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
                  --+ ISNULL(di.Recargo_old, 0)
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

      const response: OverdueSummaryResponse =
        SQLServerReadingAdapter.fromOverdueSummarySqlResultToOverdueSummaryResponse(
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
                  --+ ISNULL(di.Recargo_old, 0)
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

      if (result.length === 0) {
        return [];
      }

      const response: YearlyOverdueSummaryResponse[] = result.map((item) =>
        SQLServerReadingAdapter.fromYearlySummarySqlResultToYearlySummaryResponse(
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
}
