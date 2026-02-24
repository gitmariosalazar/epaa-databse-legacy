export interface ReadingResponse {
  sector: number;
  account: number;
  year: number;
  month: string;
  previousReading: number;
  currentReading: number | null;
  rentalIncomeCode: number | null;
  novelty: string | null;
  readingValue: number | null;
  sewerRate: number | null;
  reconnection: number | null;
  incomeCode: number | null;
  readingDate: Date;
  readingTime: string | null;
  cadastralKey: string;
}

/*
Cliente (solo en la primera fila):
- CED_IDENT_CIUDADANO
- NOMBRES_CIUDADANO
- APELLIDOS_CIUDADANO
Por cada suministro/planilla:
- ClaveCatastral
- Direccion
- Tarifa
- Mes
- Anio
- Consumo
- LecturaAnterior
- LecturaActual
- valor_epaa
- tasa_basura
- valor_terceros
- total
- Fecha_Venc_Interes
- Estado_Ingreso (usado para filtrar) pero necesito todo estos campos del codigo en php que te pase
*/

export interface PendingReadingResponse {
  // Cliente (solo en la primera fila):
  cardId: string;
  name: string;
  lastName: string;
  // Por cada suministro/planilla:
  cadastralKey: string;
  address: string;
  rate: string;
  month: string;
  year: number;
  currentReading: number;
  previousReading: number;
  readingValue: number;
  consumption: number;
  monthDue: string;
  yearDue: number;
  readingStatus: string;
  paymentDate: Date | null;
  trashRate: number;
  epaaValue: number;
  thirdPartyValue: number;
  total: number;
  dueDate: Date | null;
  incomeStatus: string;
  incomeDate: Date | null;
}
