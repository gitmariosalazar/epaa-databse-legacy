export class LegacyExecutiveDashboardResponse {
  year!: number;
  month!: string;
  totalReadingsTaken!: number;
  totalSectorsCovered!: number;
  totalActiveConnections!: number;
  totalVolumeM3!: number;
  averageConsumptionPerAccountM3!: number;
  minConsumptionM3!: number;
  maxConsumptionM3!: number;
  waterBilledUsd!: number;
  sewerBilledUsd!: number;
  totalBilledUsd!: number;
  averageTicketPerAccountUsd!: number;
  weightedAverageEffectiveTariffUsdPerM3!: number;
  totalReadingsWithNovelty!: number;
  operativeNoveltyPercentage!: number;
  totalTitleUsd?: number;
  totalTrashTaxUsd?: number;
  totalThirdPartiesUsd?: number;
  totalInterestUsd?: number;
  totalSurchargesUsd?: number;
  totalBilledEpaaUsd?: number;
}
