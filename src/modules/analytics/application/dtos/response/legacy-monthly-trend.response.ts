export class LegacyMonthlyTrendResponse {
  year!: number;
  monthNumber!: number;
  monthName!: string;
  totalReadings!: number;
  totalVolumeM3!: number;
  deltaVolumeM3!: number | null;
  growthVolumePercentage!: number | null;
  waterBilledUsd!: number;
  sewerBilledUsd!: number;
  totalBilledUsd!: number;
  deltaRevenueUsd!: number | null;
  growthRevenuePercentage!: number | null;
}
