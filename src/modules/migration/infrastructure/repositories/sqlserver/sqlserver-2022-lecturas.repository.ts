import { Injectable } from '@nestjs/common';
import { LecturasTargetRepository } from '../../../domain/contracts/lecturas-target.repository';
import { LecturaRecord } from '../../../domain/contracts/lecturas-source.repository';
import { DatabaseAbstract } from '../../../../../shared/connections/database/abstract/abstract.database';

const TABLE_NAME = 'dbo.lecturas_postgres';

/**
 * Target repository for migrating lecturas into a modern SQL Server (2022+)
 * instance. Uses the shared `DatabaseAbstract` connection (backed by the
 * `mssql` driver), the same connection service used by the `readings`
 * module for SQL Server 2022.
 */
@Injectable()
export class SqlServer2022LecturasRepository implements LecturasTargetRepository {
  constructor(private readonly databaseService: DatabaseAbstract) {}

  async recreateTable(): Promise<void> {
    await this.databaseService.execute(`
      IF OBJECT_ID('${TABLE_NAME}', 'U') IS NOT NULL
        DROP TABLE ${TABLE_NAME};

      CREATE TABLE ${TABLE_NAME} (
        acometida_id            VARCHAR(50),
        mes_lectura             VARCHAR(20),
        fecha_lectura           DATETIME,
        hora_lectura            VARCHAR(50),
        sector                  INT,
        cuenta                  INT,
        lectura_anterior        FLOAT,
        lectura_actual          FLOAT,
        novedad                 VARCHAR(500),
        tipo_novedad_lectura_id INT,
        codigo_lectura          VARCHAR(50)
      );
    `);
  }

  async bulkInsert(
    records: LecturaRecord[],
    batchSize: number,
  ): Promise<number> {
    let insertedCount = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      await this.databaseService.transaction(async (conn) => {
        const CHUNK_SIZE = 150;
        for (let j = 0; j < batch.length; j += CHUNK_SIZE) {
          const chunk = batch.slice(j, j + CHUNK_SIZE);
          const values: string[] = [];
          
          chunk.forEach((record) => {
            values.push(`(
              ${this.sqlString(record.acometidaId)},
              ${this.sqlString(record.mesLectura)},
              ${this.sqlDateTime(record.fechaLectura)},
              ${this.sqlString(record.horaLectura)},
              ${this.sqlNumber(record.sector)},
              ${this.sqlNumber(record.cuenta)},
              ${this.sqlNumber(record.lecturaAnterior)},
              ${this.sqlNumber(record.lecturaActual)},
              ${this.sqlString(record.novedad)},
              ${this.sqlNumber(record.tipoNovedadLecturaId)},
              ${this.sqlString(record.codigoLectura)}
            )`);
          });

          await conn.execute(
            `INSERT INTO ${TABLE_NAME}
             (acometida_id, mes_lectura, fecha_lectura, hora_lectura, sector, cuenta,
              lectura_anterior, lectura_actual, novedad, tipo_novedad_lectura_id, codigo_lectura)
             VALUES ${values.join(', ')}`
          );
        }
      });

      insertedCount += batch.length;
    }

    return insertedCount;
  }

  async findAll(): Promise<LecturaRecord[]> {
    const rows = await this.databaseService.query<any>(
      `SELECT * FROM ${TABLE_NAME}`,
    );

    return rows.map((row) => ({
      acometidaId: row.acometida_id,
      mesLectura: row.mes_lectura,
      fechaLectura: row.fecha_lectura,
      horaLectura: row.hora_lectura,
      sector: row.sector,
      cuenta: row.cuenta,
      lecturaAnterior: row.lectura_anterior,
      lecturaActual: row.lectura_actual,
      novedad: row.novedad,
      tipoNovedadLecturaId: row.tipo_novedad_lectura_id,
      codigoLectura: row.codigo_lectura,
    }));
  }

  private sqlString(value: string | null): string {
    if (value === null || value === undefined) return 'NULL';
    return `N'${value.replace(/'/g, "''")}'`;
  }

  private sqlNumber(value: number | null): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 'NULL';
    }
    return String(value);
  }

  private sqlDateTime(value: Date | null): string {
    if (!value) return 'NULL';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'NULL';
    const iso = date.toISOString();
    const datePart = iso.slice(0, 10).replace(/-/g, '');
    const timePart = iso.slice(11, 19);
    return `'${datePart} ${timePart}'`;
  }
}
