import { Injectable } from '@nestjs/common';
import { SQLServerReadingAdapter } from '../adapters/sql-server.reading.adapter';
import {
  RangoTarifaSQLResult,
  ReadingSQLResult,
  TarifaSQLResult,
} from '../../../interfaces/reading.sql.response';
import { InterfaceReadingsRepository } from '../../../../domain/contracts/readings.interface.repository';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { ReadingResponse } from '../../../../domain/schemas/dto/response/readings.response';
import { ReadingModel } from '../../../../domain/schemas/model/sqlserver/reading.model';
import { FindCurrentReadingParams } from '../../../../domain/schemas/dto/request/find-current-reading.paramss';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../../settings/environments/status-code';
import { MONTHS_REVERSE } from '../../../../../../shared/consts/months';

@Injectable()
export class ReadingSQLServer2022Persistence implements InterfaceReadingsRepository {
  constructor(private readonly sqlServerService: DatabaseAbstract) {}
  async createReading(reading: ReadingModel): Promise<ReadingResponse> {
    try {
      const monthNumber = MONTHS_REVERSE[reading.getMonth()];
      const query: string = `
      INSERT INTO AP_LECTURAS
      (
      Sector, Cuenta, Anio, Mes, LecturaAnterior, LecturaActual, CodigoIngresoARentas, Novedad, ValorAPagar, TasaAlcantarillado, Reconexion, FechaCaptura, HoraCaptura, ClaveCatastral, id_lectura, usuario, mesnum,
      valor_consumo_agua, valor_tasa_alcantarillado
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
      inserted.ClaveCatastral AS cadastralKey,
      inserted.id_lectura AS readingId,
      inserted.usuario AS username
      VALUES
      (
      @sector, @account, @year, @month, @previousReading, @currentReading, @rentalIncomeCode, @novelty, @readingValue, @sewerRate, @reconnection, @readingDate, @readingTime, @cadastralKey, @readingId, @username, @monthNumber,
      @readingValueCalculated, @sewerRateValue
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
        { name: 'readingId', value: reading.getReadingId() },
        { name: 'username', value: reading.getUsername() },
        { name: 'monthNumber', value: monthNumber },
        {
          name: 'readingValueCalculated',
          value: reading.getReadingValueCalculated(),
        },
        {
          name: 'sewerRateValue',
          value: reading.getSewerRate(),
        },
      ];
      const result: ReadingSQLResult[] =
        await this.sqlServerService.query<ReadingSQLResult>(query, params);

      if (!result || !result[0]) {
        throw new Error(
          'Reading was inserted but the OUTPUT clause returned no data (possibly due to a trigger).',
        );
      }

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
        ClaveCatastral AS cadastralKey,
        id_lectura AS readingId,
        usuario AS username
      FROM AP_LECTURAS
      WHERE Sector = ${Number(params.sector)}
        AND Cuenta = ${Number(params.account)}
        AND Anio = '${Number(params.year)}'
        AND Mes = '${String(params.month)}'
        AND id_lectura = '${String(params.readingId)}'
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
      /*
      console.log(
        'Received updateCurrentReading request in Persistence:',
        reading,
      );
      /*
      console.log(
        'Received updateCurrentReading params in Persistence:',
        params,
      );
      */
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
        usuario_actualizacion = @username,
        ClaveCatastral = @cadastralKey,
        updated_at = GETDATE(),
        valor_consumo_agua = @readingValueCalculated,
        valor_tasa_alcantarillado = @sewerRate
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
        inserted.ClaveCatastral AS cadastralKey,
        inserted.id_lectura AS readingId
      WHERE
        Sector = @sector AND Cuenta = @account --AND Cod_ingreso = @incomeCode
        AND Anio = @year AND Mes = @month AND id_lectura = @readingId; --AND FechaCaptura IS NULL;
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
        { name: 'readingId', value: String(params.readingId) || null },
        { name: 'username', value: reading.getUsername() },
        {
          name: 'readingValueCalculated',
          value: reading.getReadingValueCalculated(),
        },
      ];

      const updatedReading =
        await this.sqlServerService.query<ReadingSQLResult>(query, queryParams);

      //console.log('Updated reading result:', updatedReading);

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
      if (consumptionM3 < 0) {
        return 0;
      }
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
}
