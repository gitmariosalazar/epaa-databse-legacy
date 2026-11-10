export class LegacyMonthlyConnectionGrowthModel {
  constructor(
    public readonly monthNumber: number,
    public readonly monthName: string,
    public readonly connectionsBaseYear: number,
    public readonly increaseBaseYear: number,
    public readonly connectionsTargetYear: number,
    public readonly increaseTargetYear: number,
    public readonly differenceTargetVsBase: number,
    public readonly growthPercentage: number,
    public readonly statusTargetYear: string,
  ) {}
}
