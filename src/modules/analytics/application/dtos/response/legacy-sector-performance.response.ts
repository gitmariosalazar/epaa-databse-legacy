export class LegacySectorPerformanceResponse {
  sector!: number;
  totalReadings!: number;
  consumedVolumeM3!: number;
  averageConsumptionM3!: number;
  waterBilledUsd!: number;
  sewerBilledUsd!: number;
  totalBilledUsd!: number;
  revenueSharePercentage!: number;
  volumeSharePercentage!: number;
  averageTariffUsdPerM3!: number;
  noveltiesCount!: number;
  noveltyPercentage!: number;
  revenueRank!: number;
  volumeRank!: number;
  totalTitleUsd?: number;
  totalTrashTaxUsd?: number;
  totalThirdPartiesUsd?: number;
  totalInterestUsd?: number;
  totalSurchargesUsd?: number;
  totalBilledEpaaUsd?: number;
}
