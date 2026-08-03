import { MigrationResultDto } from './migration-result.dto';
import { ComparisonResultDto } from './comparison-result.dto';

export class MigrationWithComparisonResultDto {
  constructor(
    public readonly migration: MigrationResultDto,
    public readonly comparison: ComparisonResultDto,
  ) {}
}
