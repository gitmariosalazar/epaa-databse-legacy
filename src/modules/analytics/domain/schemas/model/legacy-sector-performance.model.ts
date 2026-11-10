export class LegacySectorPerformanceModel {
  constructor(
    public readonly sector: number,
    public readonly totalReadings: number,
    public readonly consumedVolumeM3: number,
    public readonly averageConsumptionM3: number,
    public readonly waterBilledUsd: number,
    public readonly sewerBilledUsd: number,
    public readonly totalBilledUsd: number,
    public readonly revenueSharePercentage: number,
    public readonly volumeSharePercentage: number,
    public readonly averageTariffUsdPerM3: number,
    public readonly noveltiesCount: number,
    public readonly noveltyPercentage: number,
    public readonly revenueRank: number,
    public readonly volumeRank: number,
    public readonly totalTitleUsd?: number,
    public readonly totalTrashTaxUsd?: number,
    public readonly totalThirdPartiesUsd?: number,
    public readonly totalInterestUsd?: number,
    public readonly totalSurchargesUsd?: number,
    public readonly totalBilledEpaaUsd?: number,
  ) {}
}
