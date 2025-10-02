import { Injectable } from '@nestjs/common';
import { InterfaceReadingsRepository } from 'src/modules/readings/domain/contracts/readings.interface.repository';
import { ReadingResponse } from 'src/modules/readings/domain/schemas/dto/response/readings.response';
import { ReadingModel } from 'src/modules/readings/domain/schemas/model/sqlserver/reading.model';
import { SQLServerReadingAdapter } from '../adapters/sql-server.reading.adapter';
import { ReadingSQLResult } from '../../../interfaces/reading.sql.response';
import { DatabaseServiceSQLServer2000 } from 'src/shared/connections/database/sqlserver/sqlserver-2000.service';
import { formatDateForSQLServer } from 'src/shared/utils/format-date';

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
  implements InterfaceReadingsRepository
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
          const insertQuery = `
  EXEC spInsertLectura 
          ${Number(reading.getSector())},
          ${Number(reading.getAccount())},
          '${String(reading.getYear())}',
          '${String(reading.getMonth())}',
          ${Number(reading.getPreviousReading())},
          ${Number(reading.getCurrentReading())},
          ${Number(reading.getRentalIncomeCode())},
          '${String(reading.getNovelty())}',
          ${reading.getReadingValue() != null ? parseFloat(reading.getReadingValue()!.toFixed(8)) : null},
          ${reading.getSewerRate() != null ? parseFloat(reading.getSewerRate()?.toFixed(8)!) : null},
          ${reading.getReconnection() != null ? parseFloat(reading.getReconnection()?.toFixed(8)!) : null},
          '${formatDateForSQLServer(reading.getReadingDate())}',
          '${String(reading.getReadingTime())}',
          '${String(reading.getCadastralKey())}'
`;
          const inserted = await conn.query(insertQuery);

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
          WHERE Sector = ${Number(reading.getSector())} 
          AND Cuenta = ${Number(reading.getAccount())}
          ORDER BY FechaCaptura DESC
        `;
          lastQuery = selectQuery;
          //const selectParams = [reading.getSector(), reading.getAccount()];
          const selectResult: ReadingSQLResult[] =
            await conn.query<ReadingSQLResult>(selectQuery);

          if (!selectResult[0]) {
            throw new DatabaseError('Failed to retrieve inserted reading');
          }

          console.log(
            `Successfully created reading for sector ${reading.getSector()}, account ${reading.getAccount()}`,
          );
          return SQLServerReadingAdapter.toDomain(selectResult[0]);
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
}
