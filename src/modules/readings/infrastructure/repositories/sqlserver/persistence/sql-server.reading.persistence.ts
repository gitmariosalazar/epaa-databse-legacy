
import { Injectable } from "@nestjs/common";
import { SQLServerReadingAdapter } from "../adapters/sql-server.reading.adapter";
import { ReadingSQLResult } from "../../../interfaces/reading.sql.response";
import { InterfaceReadingsRepository } from "../../../../domain/contracts/readings.interface.repository";
import { DatabaseServiceSQLServer2022 } from "../../../../../../shared/connections/database/sqlserver/sqlserver-2022.service";
import { ReadingResponse } from "../../../../domain/schemas/dto/response/readings.response";
import { ReadingModel } from "../../../../domain/schemas/model/sqlserver/reading.model";

@Injectable()
export class ReadingSQLServer2022Persistence implements InterfaceReadingsRepository {

  constructor(
    private readonly sqlServerService: DatabaseServiceSQLServer2022
  ) { }
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
      const result: ReadingSQLResult[] = await this.sqlServerService.query<ReadingSQLResult>(query, params);
      return SQLServerReadingAdapter.toDomain(result[0]);
    } catch (error) {
      throw error;
    }
  }
}
