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
  ) {}
}
