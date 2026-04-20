export type SearchType = 'YEAR' | 'MONTH' | 'DAY';
export class AgreementsCustomerParams {
  searchType?: SearchType; // Tipo de búsqueda: YEAR, MONTH o DAY
  startYear?: number; // YYYY para búsquedas anuales
  endYear?: number; // YYYY para búsquedas anuales
}

export class AgreementsParams {
  searchType?: SearchType; // Tipo de búsqueda: YEAR, MONTH o DAY
  startYear?: number; // YYYY para búsquedas anuales
  endYear?: number; // YYYY para búsquedas anuales
}
