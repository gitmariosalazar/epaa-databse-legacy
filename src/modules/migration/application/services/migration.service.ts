import { Injectable } from '@nestjs/common';
import { MigrateLecturasUseCase } from '../usecases/migrate-lecturas.usecase';
import { CompareLecturasUseCase } from '../usecases/compare-lecturas.usecase';
import { ComparisonResultDto } from '../../domain/schemas/dto/comparison-result.dto';
import { MigrationWithComparisonResultDto } from '../../domain/schemas/dto/migration-with-comparison-result.dto';

@Injectable()
export class MigrationService {
  constructor(
    private readonly migrateLecturasUseCase: MigrateLecturasUseCase,
    private readonly compareLecturasUseCase: CompareLecturasUseCase,
  ) {}

  async migrateLecturas(
    months?: string[],
  ): Promise<MigrationWithComparisonResultDto> {
    const migration = await this.migrateLecturasUseCase.execute(months);
    const comparison = await this.compareLecturasUseCase.execute(months);
    return new MigrationWithComparisonResultDto(migration, comparison);
  }

  compareLecturas(months?: string[]): Promise<ComparisonResultDto> {
    return this.compareLecturasUseCase.execute(months);
  }
}
