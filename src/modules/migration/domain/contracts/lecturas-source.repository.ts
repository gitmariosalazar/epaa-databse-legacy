export interface LecturaRecord {
  acometidaId: string | null;
  mesLectura: string | null;
  fechaLectura: Date | null;
  horaLectura: string | null;
  sector: number | null;
  cuenta: number | null;
  lecturaAnterior: number | null;
  lecturaActual: number | null;
  novedad: string | null;
  tipoNovedadLecturaId: number | null;
  codigoLectura: string | null;
}

export const LECTURAS_SOURCE_REPOSITORY = Symbol('LECTURAS_SOURCE_REPOSITORY');

export interface LecturasSourceRepository {
  findLecturasByMonths(months: string[]): Promise<LecturaRecord[]>;
}
