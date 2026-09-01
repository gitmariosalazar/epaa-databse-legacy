import { Injectable } from '@nestjs/common';
import { SQLServerReadingAdapter } from '../adapters/sql-server.reading.adapter';
import {
  ReadingSQL2000Result,
  ReadingSQLResult,
  RangoTarifaSQLResult,
  TarifaSQLResult,
} from '../../../interfaces/reading.sql.response';
import { InterfaceReadingsRepository } from '../../../../domain/contracts/readings.interface.repository';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { ReadingModel } from '../../../../domain/schemas/model/sqlserver/reading.model';
import { ReadingResponse } from '../../../../domain/schemas/dto/response/readings.response';
import { formatDateForSQLServer } from '../../../../../../shared/utils/format-date';
import { FindCurrentReadingParams } from '../../../../domain/schemas/dto/request/find-current-reading.paramss';
import { MONTHS_REVERSE } from '../../../../../../shared/consts/months';

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
export class ReadingSQLServer2000Persistence implements InterfaceReadingsRepository {
  constructor(private readonly sqlServerService: DatabaseAbstract) {}

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
        // createReading only persists readingValueCalculated (valor_consumo_agua); raw readingValue is client-supplied and may be null
        name: 'readingValueCalculated',
        value: reading.getReadingValueCalculated(),
        type: 'number',
        maxLength: null,
      },
      {
        name: 'readingTime',
        value: reading.getReadingTime(),
        type: 'string',
        maxLength: 50,
      },
      {
        name: 'username',
        value: reading.getUsername(),
        type: 'string',
        maxLength: 15,
      },
      {
        name: 'readingId',
        value: reading.getReadingId(),
        type: 'string',
        maxLength: 20,
      },
      {
        name: 'sewerRate',
        value: reading.getSewerRate(),
        type: 'number',
        maxLength: null,
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
      const monthNumber = MONTHS_REVERSE[reading.getMonth()];
      return await this.sqlServerService.transaction<ReadingResponse>(
        async (conn) => {
          const formattedDate = formatDateForSQLServer(
            reading.getReadingDate(),
          ).replace(/-/g, ''); // YYYYMMDD HH:mm:ss
          const insertQuery = `INSERT INTO AP_LECTURAS (Sector, Cuenta, Anio, Mes, LecturaAnterior, LecturaActual, Novedad, valor_tasa_alcantarillado, Reconexion, FechaCaptura, HoraCaptura, ClaveCatastral, usuario, id_lectura,mesnum, valor_consumo_agua) VALUES (${Number(reading.getSector())}, ${Number(reading.getAccount())}, '${String(reading.getYear())}', '${String(reading.getMonth())}', ${Number(reading.getPreviousReading())}, ${Number(reading.getCurrentReading())}, '${String(reading.getNovelty())}', ${reading.getSewerRate() != null ? parseFloat(reading.getSewerRate()?.toFixed(8)!) : 'NULL'}, ${reading.getReconnection() != null ? parseFloat(reading.getReconnection()?.toFixed(8)!) : 'NULL'}, '${formattedDate}', '${String(reading.getReadingTime())}', '${String(reading.getCadastralKey())}', '${String(reading.getUsername())}', '${String(reading.getReadingId())}', '${monthNumber}', ${reading.getReadingValueCalculated() != null ? parseFloat(reading.getReadingValueCalculated()?.toFixed(3)!) : 'NULL'})`;

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
            ClaveCatastral AS cadastralKey,
            usuario AS username,
            id_lectura AS readingId
          FROM AP_LECTURAS
          WHERE Sector = ${Number(reading.getSector())} 
          AND Cuenta = ${Number(reading.getAccount())}
          AND id_lectura = '${String(reading.getReadingId())}'
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
        ClaveCatastral AS cadastralKey,
        id_lectura AS readingId
      FROM AP_LECTURAS
      WHERE Sector = ${Number(params.sector)}
        AND Cuenta = ${Number(params.account)}
        AND Anio = '${Number(params.year)}'
        AND Mes = '${String(params.month)}'
        AND id_lectura = '${String(params.readingId)}'
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
            ClaveCatastral = '${String(reading.getCadastralKey() || '')}',
            usuario_actualizacion = '${String(reading.getUsername() || '')}',
            updated_at = GETDATE(),
            valor_tasa_alcantarillado = ${reading.getSewerRate() != null ? parseFloat(reading.getSewerRate()?.toFixed(8)!) : 'NULL'},
            valor_consumo_agua = ${reading.getReadingValueCalculated() != null ? parseFloat(reading.getReadingValueCalculated()?.toFixed(2)!) : 'NULL'}
          WHERE
            Sector = ${Number(params.sector)}
            AND Cuenta = ${Number(params.account)}
            AND Anio = '${Number(params.year)}'
            AND Mes = '${String(params.month)}'
            AND id_lectura = '${String(params.readingId || '')}'
        `;

          //console.log('Here AM i Last Query: ', updateQuery);

          lastQuery = updateQuery;
          const updateResult = await conn.query(updateQuery);

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
            ClaveCatastral AS cadastralKey,
            id_lectura AS readingId
          FROM AP_LECTURAS
          WHERE Sector = ${Number(params.sector)}
            AND Cuenta = ${Number(params.account)}
            AND Anio = '${Number(params.year)}'
            AND Mes = '${String(params.month)}'
            AND id_lectura = '${String(params.readingId || '')}'
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

  async updateSpecialCurrentReading(
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
            LecturaAnterior = ${Number(reading.getPreviousReading())},
            LecturaActual = ${Number(reading.getCurrentReading())},
            Novedad = '${String(reading.getNovelty() || '')}',
            ClaveCatastral = '${String(reading.getCadastralKey() || '')}',
            usuario_actualizacion = '${String(reading.getUsername() || '')}',
            updated_at = GETDATE(),
            valor_tasa_alcantarillado = ${reading.getSewerRate() != null ? parseFloat(reading.getSewerRate()?.toFixed(8)!) : 'NULL'},
            valor_consumo_agua = ${reading.getReadingValueCalculated() != null ? parseFloat(reading.getReadingValueCalculated()?.toFixed(2)!) : 'NULL'}
          WHERE
            Sector = ${Number(params.sector)}
            AND Cuenta = ${Number(params.account)}
            AND Anio = '${Number(params.year)}'
            AND Mes = '${String(params.month)}'
            AND id_lectura = '${String(params.readingId || '')}'
        `;

          //console.log('Here AM i Last Query: ', updateQuery);

          lastQuery = updateQuery;
          const updateResult = await conn.query(updateQuery);

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
            ClaveCatastral AS cadastralKey,
            id_lectura AS readingId
          FROM AP_LECTURAS
          WHERE Sector = ${Number(params.sector)}
            AND Cuenta = ${Number(params.account)}
            AND Anio = '${Number(params.year)}'
            AND Mes = '${String(params.month)}'
            AND id_lectura = '${String(params.readingId || '')}'
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
      if (consumptionM3 < 0) {
        return 0;
      }
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
}
