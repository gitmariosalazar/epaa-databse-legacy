export type AuditTrashRateType =
  | 'Pendientes (Cartera Corriente)' // Audita los ingresos ya pagados dentro de un rango de fechas de emisión (`Fecha_Ingreso`).
  | 'En Mora (Cartera Vencida)' // Audita todos los ingresos pendientes dentro de un rango de fechas de emisión (`Fecha_Ingreso`)
  | 'Pagados (Recaudados)'
  | 'Todos (Pagados y Pendientes)'; // Audita todos los ingresos, sin importar su estado de pago, dentro de un rango de fechas de emisión (`Fecha_Ingreso`).

export type dateFilter = 'paymentDate' | 'incomeDate';

export interface TrashRateAuditReportParams {
  startDate: string;
  endDate: string;
  limit: number;
  offset: number;
  diagnosticFilter: 'DIFFERENT_AND_NO_RECORD' | 'ALL';
  auditType: AuditTrashRateType;
  dateFilter: dateFilter;
}
