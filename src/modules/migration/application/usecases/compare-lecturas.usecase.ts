import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  LECTURAS_SOURCE_REPOSITORY,
  LecturaRecord,
  LecturasSourceRepository,
} from '../../domain/contracts/lecturas-source.repository';
import {
  LECTURAS_TARGET_REPOSITORY,
  LecturasTargetRepository,
} from '../../domain/contracts/lecturas-target.repository';
import {
  ComparisonResultDto,
  MismatchDetail,
} from '../../domain/schemas/dto/comparison-result.dto';
import { ComparisonFailedException } from '../../domain/exceptions/migration.exceptions';

const COMPARABLE_FIELDS: (keyof LecturaRecord)[] = [
  'lecturaAnterior',
  'lecturaActual',
  'novedad',
  'tipoNovedadLecturaId',
  'codigoLectura',
];

const DEFAULT_MONTHS = ['2026-07', '2026-06', '2026-05', '2026-04', '2026-03'];

@Injectable()
export class CompareLecturasUseCase {
  private readonly logger = new Logger(CompareLecturasUseCase.name);

  constructor(
    @Inject(LECTURAS_SOURCE_REPOSITORY)
    private readonly sourceRepository: LecturasSourceRepository,
    @Inject(LECTURAS_TARGET_REPOSITORY)
    private readonly targetRepository: LecturasTargetRepository,
  ) {}

  async execute(
    months: string[] = DEFAULT_MONTHS,
  ): Promise<ComparisonResultDto> {
    try {
      const [sourceRecords, targetRecords] = await Promise.all([
        this.sourceRepository.findLecturasByMonths(months),
        this.targetRepository.findAll(),
      ]);

      const targetIndex = this.buildIndex(targetRecords);

      let matched = 0;
      let mismatched = 0;
      let missing = 0;
      const mismatches: MismatchDetail[] = [];

      for (const sourceRecord of sourceRecords) {
        const key = this.buildKey(sourceRecord);
        const targetRecord = targetIndex.get(key);

        if (!targetRecord) {
          missing++;
          continue;
        }

        const fieldMismatches = this.diffFields(sourceRecord, targetRecord);
        if (fieldMismatches.length === 0) {
          matched++;
        } else {
          mismatched++;
          mismatches.push(...fieldMismatches);
        }
      }

      const total = sourceRecords.length || 1;
      const effectiveness = Number(((matched / total) * 100).toFixed(2));

      return new ComparisonResultDto(
        sourceRecords.length,
        targetRecords.length,
        matched,
        mismatched,
        missing,
        effectiveness,
        mismatches,
      );
    } catch (error) {
      this.logger.error(
        'Error durante la comparación de lecturas',
        error as Error,
      );
      throw new ComparisonFailedException((error as Error).message);
    }
  }

  private buildKey(record: LecturaRecord): string {
    return `${record.acometidaId}|${record.mesLectura}`;
  }

  private buildIndex(records: LecturaRecord[]): Map<string, LecturaRecord> {
    const index = new Map<string, LecturaRecord>();
    for (const record of records) {
      index.set(this.buildKey(record), record);
    }
    return index;
  }

  private diffFields(
    source: LecturaRecord,
    target: LecturaRecord,
  ): MismatchDetail[] {
    const diffs: MismatchDetail[] = [];
    for (const field of COMPARABLE_FIELDS) {
      const sourceValue = source[field];
      const targetValue = target[field];
      if (!this.valuesAreEqual(sourceValue, targetValue)) {
        diffs.push(
          new MismatchDetail(
            source.acometidaId,
            source.mesLectura,
            field,
            sourceValue,
            targetValue,
          ),
        );
      }
    }
    return diffs;
  }

  private valuesAreEqual(a: unknown, b: unknown): boolean {
    if (typeof a === 'number' && typeof b === 'number') {
      return Math.abs(a - b) < 0.001;
    }
    return String(a ?? '').trim() === String(b ?? '').trim();
  }
}
