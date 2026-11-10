export class LegacyNoveltyEconomicImpactModel {
  constructor(
    public readonly novelty: string,
    public readonly casesCount: number,
    public readonly shareOfTotalReadingsPercentage: number,
    public readonly totalVolumeM3: number,
    public readonly averageVolumePerCaseM3: number,
    public readonly waterBilledUsd: number,
    public readonly sewerBilledUsd: number,
    public readonly totalBilledUsd: number,
    public readonly totalTitleUsd?: number,
    public readonly totalTrashTaxUsd?: number,
    public readonly totalThirdPartiesUsd?: number,
    public readonly totalInterestUsd?: number,
    public readonly totalSurchargesUsd?: number,
    public readonly totalBilledEpaaUsd?: number,
    public readonly totalInterestImprovementsUsd?: number,
    public readonly totalCollectedUsd?: number,
    public readonly totalPendingDebtUsd?: number,
    public readonly totalOverdueDebtUsd?: number,
    public readonly paidCasesCount?: number,
    public readonly unpaidCasesCount?: number,
  ) {}
}
