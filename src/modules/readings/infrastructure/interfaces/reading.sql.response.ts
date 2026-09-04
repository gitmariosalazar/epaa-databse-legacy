export interface ReadingSQLResult {
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
  incomeCode: number | null;
  readingDate: Date;
  readingTime: string | null;
  cadastralKey: string;
  readingId?: string | number;
}

export interface ReadingSQL2000Result {
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
  incomeCode: number | null;
  readingDate: Date;
  readingTime: string | null;
  cadastralKey: string;
  readingId?: string | number;
}

export interface TarifaSQLResult {
  Tarifa: string;
}

export interface RangoTarifaSQLResult {
  Minimo: number;
  Maximo: number;
  Base: number;
  Adicional: number;
}

export interface DashboardKpiSqlResult {
  year: number;
  month: string;
  sector: number;

  // Cantidad de lecturas
  total_meters_read: number;

  // Consumos (Metros Cúbicos)
  total_consumption_m3: number;
  average_consumption_m3: number;

  // Valores propios de AP_LECTURAS
  consumption_value: number; // Mantenido igual que el alias en SQL
  total_sewage_value: number;

  // Valores financieros (Agua y Tasas en Datos_ingreso)
  total_billed_water: number;
  total_paid_water: number;
  total_unpaid_water: number;

  total_trash_rate: number;
  total_old_improvements_interest: number;
  total_surcharge: number;
  total_bills_generated: number;

  // Intereses y conteos de facturas
  total_interest_calculated: number;
  unpaid_bills_count: number;
  paid_bills_count: number;

  // Total deuda general consolidada
  total_debt_amount: number;
}
