export class LegacyNoveltyEconomicImpactResponse {
  novelty!: string;
  casesCount!: number;
  shareOfTotalReadingsPercentage!: number;
  totalVolumeM3!: number;
  averageVolumePerCaseM3!: number;
  waterBilledUsd!: number;
  sewerBilledUsd!: number;
  totalBilledUsd!: number;
  totalTitleUsd?: number;
  totalTrashTaxUsd?: number;
  totalThirdPartiesUsd?: number;
  totalInterestUsd?: number;
  totalSurchargesUsd?: number;
  totalBilledEpaaUsd?: number;
}
