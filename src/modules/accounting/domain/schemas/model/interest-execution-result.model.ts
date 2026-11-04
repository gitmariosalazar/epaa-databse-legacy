export class InterestExecutionResult {
  constructor(
    public readonly executedAt: Date,
    public readonly success: boolean,
    public readonly message: string,
  ) {}
}
