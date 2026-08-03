export class MigrationResultDto {
  constructor(
    public readonly tableName: string,
    public readonly totalRead: number,
    public readonly totalInserted: number,
    public readonly durationMs: number,
  ) {}
}
