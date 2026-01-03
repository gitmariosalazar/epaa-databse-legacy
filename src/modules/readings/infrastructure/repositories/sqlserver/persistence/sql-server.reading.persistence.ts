import { Injectable } from '@nestjs/common';
import { SQLServerReadingAdapter } from '../adapters/sql-server.reading.adapter';
import { ReadingSQLResult } from '../../../interfaces/reading.sql.response';
import { InterfaceReadingsRepository } from '../../../../domain/contracts/readings.interface.repository';
import { DatabaseServiceSQLServer2022 } from '../../../../../../shared/connections/database/sqlserver/sqlserver-2022.service';
import { ReadingResponse } from '../../../../domain/schemas/dto/response/readings.response';
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
        //  { name: 'incomeCode', value: reading.getIncomeCode() }
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
        AND Cod_ingreso = ${Number(params.incomeCode)}
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
      const query: string = `
      UPDATE AP_LECTURAS
      SET
        LecturaActual = @currentReading,
        Novedad = @novelty,
        ValorAPagar = @readingValue,
        TasaAlcantarillado = @sewerRate,
        Reconexion = @reconnection,
        FechaCaptura = @readingDate,
        HoraCaptura = @readingTime,
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
        Sector = @sector AND Cuenta = @account AND Cod_ingreso = @incomeCode
        AND Anio = @year AND Mes = @month AND LecturaAnterior = @previousReading AND FechaCaptura IS NULL;
      `;
      const queryParams: any[] = [
        { name: 'currentReading', value: reading.getCurrentReading() },
        { name: 'novelty', value: reading.getNovelty() },
        { name: 'readingValue', value: reading.getReadingValue() },
        { name: 'sewerRate', value: reading.getSewerRate() },
        { name: 'reconnection', value: reading.getReconnection() },
        { name: 'readingDate', value: reading.getReadingDate() },
        { name: 'readingTime', value: reading.getReadingTime() },
        { name: 'cadastralKey', value: reading.getCadastralKey() },
        { name: 'sector', value: params.sector },
        { name: 'account', value: params.account },
        { name: 'incomeCode', value: params.incomeCode },
        { name: 'year', value: params.year },
        { name: 'month', value: params.month },
        { name: 'previousReading', value: params.previousReading },
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
}
