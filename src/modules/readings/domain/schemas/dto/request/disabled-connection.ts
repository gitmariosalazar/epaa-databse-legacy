// UPDATE AP_LECTURAS SET Novedad = 'SUSPENDIDO', observacion = 'TEST DE SUSPENSION' WHERE Cod_ingreso = 2579176 AND Sector = 14 AND Cuenta = 293 AND Anio = 2026 AND Mes = 'NOVIEMBRE';
export type DisabledConnectionState = 'SUSPENDIDO' | 'NORMAL';

export class DisabledConnectionRequest {
  incomeCode!: number;
  sector!: number;
  account!: number;
  year!: number;
  month!: string;
  description!: string;
  state!: DisabledConnectionState;
}
