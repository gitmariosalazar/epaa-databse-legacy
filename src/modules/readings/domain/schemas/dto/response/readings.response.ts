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

  // ▼ Campos Modificados de Basura ▼
  trashRateOfficial: number; // Mapea a trash_rate_official
  trashRateForPayment: number; // Mapea a trash_rate_for_payment
  trashRatePrevious: number; // Mapea a trash_rate_previous
  balanceInFavorNextMonth: number; // Mapea a balance_in_favor_next_month
  balanceAgainstNextMonth: number; // Mapea a balance_against_next_month
  discountTrashRate: number; // Mapea a discount_trash_rate
  totalTrashRate: number; // Mapea a total_trash_rate

  epaaValue: number; // Mapea a epaa_value
  thirdPartyValue: number; // Mapea a third_party_value
  surcharge: number; // Mapea a surcharge
  totalEpaaValue: number; // Mapea a total_epaa_value
  total: number; // Mapea a total
  adjustedTotal: number; // Mapea a adjusted_total

  dueDate: Date | null;
  incomeStatus: string;
  incomeDate: Date | null;
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
