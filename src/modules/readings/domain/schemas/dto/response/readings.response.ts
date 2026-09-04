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
  readingId: string;
}

export interface DashboardKpiResponse {
  year: number;
  month: string;
  sector: number;

  // Cantidad de lecturas
  totalMetersRead: number;

  // Consumos (Metros Cúbicos)
  totalConsumptionM3: number;
  averageConsumptionM3: number;

  // Valores propios de AP_LECTURAS
  consumptionValue: number; // Mantenido igual que el alias en SQL
  totalSewageValue: number;

  // Valores financieros (Agua y Tasas en Datos_ingreso)
  totalBilledWater: number;
  totalPaidWater: number;
  totalUnpaidWater: number;

  totalTrashRate: number;
  totalOldImprovementsInterest: number;
  totalSurcharge: number;
  totalBillsGenerated: number;

  // Intereses y conteos de facturas
  totalInterestCalculated: number;
  unpaidBillsCount: number;
  paidBillsCount: number;

  // Total deuda general consolidada
  totalDebtAmount: number;
}
