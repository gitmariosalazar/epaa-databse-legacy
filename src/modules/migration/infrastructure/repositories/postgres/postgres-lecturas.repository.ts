import { Injectable } from '@nestjs/common';
import { Client } from 'pg';
import {
  LecturaRecord,
  LecturasSourceRepository,
} from '../../../domain/contracts/lecturas-source.repository';
import { environments } from '../../../../../settings/environments/environments';

@Injectable()
export class PostgresLecturasRepository implements LecturasSourceRepository {
  async findLecturasByMonths(months: string[]): Promise<LecturaRecord[]> {
    const client = new Client({
      user: environments.POSTGRESQL_USER,
      password: environments.POSTGRESQL_PASSWORD,
      host: environments.POSTGRESQL_HOST,
      port: Number(environments.POSTGRESQL_PORT),
      database: environments.POSTGRESQL_DATABASE,
    });

    await client.connect();
    try {
      const result = await client.query(
        `SELECT
            l.acometida_id,
            l.mes_lectura,
            l.fecha_lectura,
            l.hora_lectura,
            l.sector,
            l.cuenta,
            l.lectura_anterior,
            l.lectura_actual,
            l.novedad,
            l.tipo_novedad_lectura_id,
            l.codigo_lectura
         FROM lectura l
         WHERE l.mes_lectura = ANY($1)
           AND COALESCE(l.novedad, '') !~* 'CAMBIO|INICIAL'
         ORDER BY l.acometida_id, l.mes_lectura`,
        [months],
      );
      return result.rows.map((row) => this.mapRow(row));
    } finally {
      await client.end();
    }
  }

  private mapRow(row: any): LecturaRecord {
    return {
      acometidaId: this.cleanString(row.acometida_id),
      mesLectura: this.cleanString(row.mes_lectura),
      fechaLectura: this.parseDate(row.fecha_lectura),
      horaLectura: this.cleanString(row.hora_lectura),
      sector: this.parseNumber(row.sector),
      cuenta: this.parseNumber(row.cuenta),
      lecturaAnterior: this.parseNumber(row.lectura_anterior),
      lecturaActual: this.parseNumber(row.lectura_actual),
      novedad: this.cleanString(row.novedad),
      tipoNovedadLecturaId: this.parseNumber(row.tipo_novedad_lectura_id),
      codigoLectura: this.cleanString(row.codigo_lectura),
    };
  }

  private cleanString(val: any): string | null {
    if (val === undefined || val === null) return null;
    const str = String(val).trim();
    return str === '' ? null : str;
  }

  private parseNumber(val: any): number | null {
    if (val === undefined || val === null) return null;
    const num = parseFloat(String(val).replace(/,/g, '').trim());
    return isNaN(num) ? null : num;
  }

  private parseDate(val: any): Date | null {
    if (val === undefined || val === null) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
}
