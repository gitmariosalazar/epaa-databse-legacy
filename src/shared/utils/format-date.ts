import { toZonedTime } from "date-fns-tz";
export const formatDateForSQLServer = (date: string | Date): string => {
  const newDate = new Date(date);
  if (isNaN(newDate.getTime())) throw new Error(`Invalid date: ${date}`);
  const formatDate: Date = toZonedTime(newDate,'America/Guayaquil');

  const yyyy =formatDate.getFullYear();
  const mm = String(formatDate.getMonth() + 1).padStart(2, '0'); 
  const dd = String(formatDate.getDate()).padStart(2, '0');
  const hh = String(formatDate.getHours()).padStart(2, '0');
  const mi = String(formatDate.getMinutes()).padStart(2, '0');
  const ss = String(formatDate.getSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}