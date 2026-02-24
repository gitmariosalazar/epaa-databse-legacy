export interface ExternalPayrollItem {
  Cod_Ingreso: number;
  Valor_Titulo: number;
  Cod_Titulo_Datos: string;
  Fecha_Ingreso: string;
  ClaveCatastral: string;
  Estado_Ingreso: string | null;
  Fecha_Venc_Interes: string;
  CED_IDENT_CIUDADANO: string;
  APELLIDOS_CIUDADANO: string;
  NOMBRES_CIUDADANO: string;
  IVA: number;
  Tipo_De_Ingreso: string;
  LecturaAnterior: string;
  LecturaActual: string;
  Anio: string;
  Mes: string;
  Tarifa: string;
  Fecha_Pago: string | null;
  Consumo: string;
  Fecha_Ingreso_Format: string;
  Fecha_Venc_Format: string;
  Cuota_Del: string | null;
  Intereses: number;
  Recargo: number;
  interes_mejoras: number;
  multas_mejoras_act: number | null;
  Direccion: string;
  valor_epaa: number;
  valor_terceros: number;
  total: number;
}

export interface ExternalPayrollData {
  success: boolean;
  data: ExternalPayrollItem[];
}

export interface ExternalPayrollResponse {
  data: ExternalPayrollData;
}
