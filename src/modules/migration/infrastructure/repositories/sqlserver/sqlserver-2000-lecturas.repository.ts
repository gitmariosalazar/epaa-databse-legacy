import { Injectable } from '@nestjs/common';
import { LecturasTargetRepository } from '../../../domain/contracts/lecturas-target.repository';
import { LecturaRecord } from '../../../domain/contracts/lecturas-source.repository';
import { DatabaseAbstract } from '../../../../../shared/connections/database/abstract/abstract.database';

const TABLE_NAME = 'dbo.lecturas_postgres';

/**
 * Target repository for migrating lecturas into a legacy SQL Server 2000
 * instance. Uses the shared `DatabaseAbstract` connection (backed by the
 * ODBC driver via a DSN), the same connection service used by the
 * `readings` module for SQL Server 2000.
 *
 * NOTE: the ODBC/TDS 7.0 combination used to talk to real SQL Server 2000
 * instances in this codebase does not reliably support bound/parameterized
 * queries (see ReadingSQLServer2000Persistence), so values are inlined into
 * the SQL text instead. To stay safe from SQL injection, string values are
 * escaped (single quotes doubled) before being inlined.
 */
@Injectable()
export class SqlServer2000LecturasRepository implements LecturasTargetRepository {
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
        novedad                 NVARCHAR(500),
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
        const selects: string[] = [];
        for (const record of batch) {
          selects.push(`SELECT 
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
              ${this.sqlString(record.codigoLectura)}`);
        }

        const insertSql = `INSERT INTO ${TABLE_NAME}
          (acometida_id, mes_lectura, fecha_lectura, hora_lectura, sector, cuenta,
           lectura_anterior, lectura_actual, novedad, tipo_novedad_lectura_id, codigo_lectura)
          ${selects.join(' UNION ALL ')}`;

        await conn.execute(insertSql);
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
