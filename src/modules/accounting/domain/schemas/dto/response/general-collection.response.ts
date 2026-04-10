export interface GeneralCollectionResponse {
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
  paymentMethod: string;
  comment: string;
}

export interface GeneralDailyGroupedReportResponse {
  day: string; // YYYYMMDD  e.g. '20260201'
  date: string; // YYYY-MM-DD e.g. '2026-02-01'
  collector: string; // User_Cobro
  titleCode: string; // Cod_Titulo_Datos
  paymentMethod: string; // FormaDePago
  status: string; // Estado_Ingreso

  titleValue: number; // SUM(Valor_Titulo)
  thirdPartyValue: number; // SUM(ValorTerceros)
  surchargeValue: number; // SUM(Recargo)
  trashRateValue: number; // SUM(tasa_basura)
  discountTrashRateValue: number; // SUM(descuento) descuento de tasa de basura
  totalValue: number; // SUM of all four above
  recordCount: number; // COUNT(Cod_Ingreso)
}

export type typeKPI =
  | 'EPAA'
  | 'SURCHARGE'
  | 'COLLECTION TRASH RATE'
  | 'THIRD PARTIES'
  | 'IMPROVEMENTS';

export interface KPISection {
  typeKPI: typeKPI;
  // Conteos (Bills)
  countTotal: number;
  countPending: number;
  countCollected: number;
  countZero: number;
  countNull: number;
  countGreaterThanZero: number;
  countLessThanZero: number;

  // Valores Monetarios (Importante para tus SUM de SQL)
  amountTotal: number;
  amountPending: number;
  amountCollected: number;
  amountDiscounts?: number; // Solo aplica a trash_rate según tu SQL
}

export interface GeneralKPIResponse {
  uniqueCadastralKeys: number;
  totalBillsIssued: number; // El COUNT(di.Cod_Ingreso) general
  averagePaidBill: number;
  countNotes: number;
  totalNotesAmount: number;
  sections: KPISection[]; // El array con el desglose de cada tipo
  codeTitle: string;
}

export interface GeneralYearlyGroupedReportResponse {
  year: string;
  collector: string;
  titleCode: string;
  paymentMethod: string;
  status: string;

  titleValue: number;
  thirdPartyValue: number;
  surchargeValue: number;
  trashRateValue: number;
  discountTrashRateValue: number;
  totalValue: number;
  recordCount: number;
}

export interface GeneralMonthlyGroupedReportResponse {
  month: string;
  year: string;
  collector: string;
  titleCode: string;
  paymentMethod: string;
  status: string;

  titleValue: number;
  thirdPartyValue: number;
  surchargeValue: number;
  trashRateValue: number;
  discountTrashRateValue: number;
  totalValue: number;
  recordCount: number;
}

export interface GeneralYearlyKPIResponse extends GeneralKPIResponse {
  year: string;
}

export interface GeneralMonthlyKPIResponse extends GeneralKPIResponse {
  month: string;
  year: string;
}
