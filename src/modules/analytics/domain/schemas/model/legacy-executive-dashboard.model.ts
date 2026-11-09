export class LegacyExecutiveDashboardModel {
  constructor(
    public readonly year: number,
    public readonly month: string,
    public readonly totalReadingsTaken: number,
    public readonly totalSectorsCovered: number,
    public readonly totalActiveConnections: number,
    public readonly totalVolumeM3: number,
    public readonly averageConsumptionPerAccountM3: number,
    public readonly minConsumptionM3: number,
    public readonly maxConsumptionM3: number,
    public readonly waterBilledUsd: number,
    public readonly sewerBilledUsd: number,
    public readonly totalBilledUsd: number,
    public readonly averageTicketPerAccountUsd: number,
    public readonly weightedAverageEffectiveTariffUsdPerM3: number,
    public readonly totalReadingsWithNovelty: number,
    public readonly operativeNoveltyPercentage: number,
  ) {}
}
