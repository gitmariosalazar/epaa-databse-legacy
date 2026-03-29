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

export interface PendingReadingResponse {
  // ── Identificación del Cliente y Suministro ────────────────────────────────
  incomeCode: string;
  incomeTitleCode?: string;
  readingCaptureDate?: Date;
  cardId: string;
  name: string;
  lastName: string;
  cadastralKey: string;
  address: string;
  rate: string;

  // ── Período de Facturación e Ingresos ──────────────────────────────────────
  month: string;
  year: number;
  monthDue: string;
  yearDue: number;
  dueDate: Date | null;
  paymentDate: Date | null;
  incomeStatus: string;
  incomeDate: Date | null;

  // ── Lectura del Medidor ────────────────────────────────────────────────────
  currentReading: number;
  previousReading: number;
  consumption: number;
  readingStatus: string;
  readingValue: number;

  // ── Valores de Agua (Servicios Base) ───────────────────────────────────────
  epaaValue: number; // Valor del consumo de agua
  thirdPartyValue: number; // Valor por servicios de terceros (ej. alcantarillado)
  surcharge: number; // Recargo por mora
  totalEpaaValue: number; // Subtotal: Agua + Terceros + Recargo

  // ── Tasa de Basura y Notas de Crédito ──────────────────────────────────────
  trashRateOfficial: number; // Tarifa de basura OFICIAL (según tabla Valor o Datos_ingreso)
  trashRate: number; // Lo que EFECTIVAMENTE paga (0 si el saldo a favor cubre todo)
  trashRatePrevious: number; // Crédito o nota de crédito original que arrastra del pasado
  balanceInFavorCurrentMonth: number; // Saldo a favor actual
  balanceInFavorNextMonth: number; // Saldo sobrante a favor para el próximo mes
  balanceAgainstNextMonth: number; // Saldo en contra (siempre nulo/0)
  discountTrashRate: number; // Descuento manual aplicado (0 en recibos pendientes)
  totalTrashRate: number; // Total neto de basura cobrado en esta planilla

  // ── Totales de la Planilla ─────────────────────────────────────────────────
  total: number; // Sumatoria base asumiendo tarifa plena de basura
  adjustedTotal: number; // TOTAL REAL A PAGAR (Total Epaa + Basura Efectiva Pagada)
}

export interface PaymentReadingResponse {
  incomeCode: string;
  cardId: string;
  name: string;
  lastName: string;
  cadastralKey: string;
  address: string;
  rate: number;
  month: string;
  year: number;
  currentReading: number;
  previousReading: number;
  readingValue: number;
  paymentUser: string;
  titleCode: string;
  consumption: number;
  readingStatus: string;
  paymentDate: string;
  trashRate: number;
  epaaValue: number;
  thirdPartyValue: number;
  surcharge: number;
  total: number;
  dueDate: string;
  incomeStatus: string;
  incomeDate: string;
  value: number;
  orderValue: number;
  paymentMethod: string;
  comment: string;
}

export interface PaymentResponse {
  incomeCode: string;
  cardId: string;
  name: string;
  incomeDate: string;
  paymentDate: string;
  incomeStatus: string;
  titleCode: string;
  dueDate: string;
  titleValue: number;
  thirdPartyValue: number;
  surcharge: number;
  trashRate: number;
  cadastralKey: string;
  total: number;
  paymentUser: string;
  value?: number;
  orderValue?: number;
  paymentMethod: string;
  comment: string;
}

export interface OverduePaymentResponse {
  cadastralKey: string;
  clientId: string;
  name: string;
  totalTrashRate: number;
  totalEpaaValue: number;
  totalOldImprovementsInterest: number;
  totalSurcharge: number;
  totalOldSurcharge: number;
  monthsPastDue: number;
}

export interface OverdueSummaryResponse {
  totalClientsWithDebt: number;
  totalUniqueCadastralKeys: number;
  totalMonthsPastDue: number;
  totalDebtAmount: number;
  totalEpaaValue: number;
  totalTrashRate: number;
  totalSurcharge: number;
  totalOldSurcharge: number;
  totalImprovementsInterest: number;
  avgMonthsPastDue: number;
  maxMonthsInDebt: number;
  minMonthsInDebt: number;
  clientsOver6Months: number;
  clientsOver1Year: number;
  maxDaysInDebt: number;
  avgDebtPerClient: number;
}

export interface YearlyOverdueSummaryResponse {
  year: number;
  totalUniqueClients: number;
  totalUniqueCadastralKeys: number;
  clientsWithDebt: number;
  totalUniqueCadastralKeysByYear: number;
  totalMonthsPastDue: number;
  totalDebtAmount: number;
  totalEpaaValue: number;
  totalTrashRate: number;
  totalSurcharge: number;
  totalOldSurcharge: number;
  totalImprovementsInterest: number;
  avgMonthsPastDue: number;
  maxMonthsInDebt: number;
  minMonthsInDebt: number;
  clientsOver6Months: number;
  clientsOver1Year: number;
  maxDaysInDebt: number;
  avgDebtPerClient: number;
}

export interface MonthlyDebtSummaryResponse {
  year: number;
  month: number;
  monthName: string; // ENERO, FEBRERO, etc.

  totalUniqueClients: number;
  totalUniqueCadastralKeys: number;

  clientsWithDebtThisMonth: number;
  uniqueCadastralKeysThisMonth: number;

  totalMonthsPastDue: number;
  totalDebtAmount: number;

  totalEpaaValue: number;
  totalTrashRate: number;
  totalSurcharge: number;
  totalOldSurcharge: number;
  totalImprovementsInterest: number;

  avgMonthsPastDue: number | null;
  maxMonthsInDebt: number;
  minMonthsInDebt: number;

  clientsOver6Months: number;
  clientsOver1Year: number;

  maxDaysInDebt: number;
  avgDebtPerClient: number;
}
