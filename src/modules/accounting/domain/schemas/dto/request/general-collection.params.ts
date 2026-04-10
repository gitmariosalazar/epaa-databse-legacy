export type dateFilter = 'paymentDate' | 'incomeDate';
export class GeneralCollectionsParams {
  dateFilter?: dateFilter;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  year?: number; // YYYY para búsquedas anuales
  titleCode?: string; // Cod_Titulo_Datos
  limit?: number; // Para paginación, opcional
  offset?: number; // Para paginación, opcional
}

export class GeneralTrendCollectionsParams {
  dateFilter?: dateFilter;
  startYear?: number; // YYYY para búsquedas anuales
  endYear?: number; // YYYY para búsquedas anuales
  titleCode?: string; // Cod_Titulo_Datos
  limit?: number; // Para paginación, opcional
  offset?: number; // Para paginación, opcional
}
