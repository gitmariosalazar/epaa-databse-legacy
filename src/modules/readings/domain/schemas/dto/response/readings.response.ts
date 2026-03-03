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
  trashRate: number;
  trashRatePrevious: number;
  epaaValue: number;
  thirdPartyValue: number;
  balanceInFavor: number;
  balanceAgainst: number;
  discountTrashRate: number;
  surcharge: number;
  adjustedTotal: number;
  total: number;
  dueDate: Date | null;
  incomeStatus: string;
  incomeDate: Date | null;
  totalTrashRate: number; // tasa de basura ajustada neta
  totalEpaaValue: number; // total agua + terceros
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
