export class LegacyMonthlyTrendModel {
  constructor(
    public readonly year: number,
    public readonly monthNumber: number,
    public readonly monthName: string,
    public readonly totalReadings: number,
    public readonly totalVolumeM3: number,
    public readonly deltaVolumeM3: number | null,
    public readonly growthVolumePercentage: number | null,
    public readonly waterBilledUsd: number,
    public readonly sewerBilledUsd: number,
    public readonly totalBilledUsd: number,
    public readonly deltaRevenueUsd: number | null,
    public readonly growthRevenuePercentage: number | null,
    public readonly totalTitleUsd?: number,
    public readonly totalTrashTaxUsd?: number,
    public readonly totalThirdPartiesUsd?: number,
    public readonly totalInterestUsd?: number,
    public readonly totalSurchargesUsd?: number,
    public readonly totalBilledEpaaUsd?: number,
  ) {}
}
