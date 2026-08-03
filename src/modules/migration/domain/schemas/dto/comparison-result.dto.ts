export class MismatchDetail {
  constructor(
    public readonly acometidaId: string | null,
    public readonly mesLectura: string | null,
    public readonly field: string,
    public readonly sourceValue: unknown,
    public readonly targetValue: unknown,
  ) {}
}

export class ComparisonResultDto {
  constructor(
    public readonly totalSource: number,
    public readonly totalTarget: number,
    public readonly matchedCount: number,
    public readonly mismatchedCount: number,
    public readonly missingInTargetCount: number,
    public readonly effectivenessPercentage: number,
    public readonly mismatches: MismatchDetail[],
  ) {}
}
