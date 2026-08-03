import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  LECTURAS_SOURCE_REPOSITORY,
  LecturasSourceRepository,
} from '../../domain/contracts/lecturas-source.repository';
import {
  LECTURAS_TARGET_REPOSITORY,
  LecturasTargetRepository,
} from '../../domain/contracts/lecturas-target.repository';
import { MigrationResultDto } from '../../domain/schemas/dto/migration-result.dto';
import { MigrationFailedException } from '../../domain/exceptions/migration.exceptions';

const DEFAULT_MONTHS = ['2026-07', '2026-06', '2026-05', '2026-04', '2026-03'];
const BATCH_SIZE = 500;
const TARGET_TABLE_NAME = 'dbo.lecturas_postgres';

@Injectable()
export class MigrateLecturasUseCase {
  private readonly logger = new Logger(MigrateLecturasUseCase.name);

  constructor(
    @Inject(LECTURAS_SOURCE_REPOSITORY)
    private readonly sourceRepository: LecturasSourceRepository,
    @Inject(LECTURAS_TARGET_REPOSITORY)
    private readonly targetRepository: LecturasTargetRepository,
  ) {}

  async execute(
    months: string[] = DEFAULT_MONTHS,
  ): Promise<MigrationResultDto> {
    const startedAt = Date.now();
    try {
      this.logger.log('Leyendo lecturas desde PostgreSQL...');
      const records = await this.sourceRepository.findLecturasByMonths(months);

      if (records.length === 0) {
        this.logger.warn('No hay registros para migrar.');
        return new MigrationResultDto(
          TARGET_TABLE_NAME,
          0,
          0,
          Date.now() - startedAt,
        );
      }

      this.logger.log(`Recreando tabla destino "${TARGET_TABLE_NAME}"...`);
      await this.targetRepository.recreateTable();

      this.logger.log(
        `Insertando ${records.length} registros en lotes de ${BATCH_SIZE}...`,
      );
      const totalInserted = await this.targetRepository.bulkInsert(
        records,
        BATCH_SIZE,
      );

      return new MigrationResultDto(
        TARGET_TABLE_NAME,
        records.length,
        totalInserted,
        Date.now() - startedAt,
      );
    } catch (error) {
      this.logger.error(
        'Error durante la migración de lecturas',
        error as Error,
      );
      throw new MigrationFailedException((error as Error).message);
    }
  }
}
