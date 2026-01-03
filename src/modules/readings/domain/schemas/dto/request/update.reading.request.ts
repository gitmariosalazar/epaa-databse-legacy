export class UpdateReadingRequest {
  sector: number;
  account: number;
  year: number;
  month: string;
  previousReading: number;
  currentReading: number;
  rentalIncomeCode: number | null;
  novelty: string | null;
  readingValue: number | null;
  sewerRate: number | null;
  reconnection: number | null;
  //incomeCode: number | null
  readingDate: Date;
  readingTime: string;
  cadastralKey: string;
}

/*
UPDATE AP_LECTURAS
	SET
		LecturaActual = NULL,
		-- CodigoIngresoARentas = 6615116,
		Novedad = NULL,
		-- ValorAPagar = 23,
		TasaAlcantarillado = NULL,
		FechaCaptura = NULL,
		HoraCaptura = NULL,
		-- LecturaSugerida = 1,
		ClaveCatastral = '21-260'
	WHERE
		Sector = 21 AND Cuenta = 260 AND Cod_ingreso = 2423687
		AND Anio = 2026 AND Mes = 'ENERO' AND LecturaAnterior = 982 AND FechaCaptura IS NULL;
*/
