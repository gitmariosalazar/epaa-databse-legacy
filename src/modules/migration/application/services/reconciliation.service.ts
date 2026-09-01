import { Injectable } from '@nestjs/common';
import { GetReconciliationSummaryUseCase } from '../usecases/get-reconciliation-summary.usecase';
import { GetReconciliationDuplicatesUseCase } from '../usecases/get-reconciliation-duplicates.usecase';
import { GetReconciliationMismatchesUseCase } from '../usecases/get-reconciliation-mismatches.usecase';
import { GetReconciliationKpisUseCase } from '../usecases/getReconciliationKpis.use-case';
import { GetDiscrepanciesDetailUseCase } from '../usecases/getDiscrepanciesDetail.use-case';
import { ReconciliationPeriod, AuditoriaFiltroType } from '../../domain/contracts/lecturas-reconciliation.repository';
import { InvalidReconciliationPeriodException } from '../../domain/exceptions/migration.exceptions';
import { MONTHS } from '../../../../shared/consts/months';

const MES_LECTURA_PATTERN = /^(\d{4})-(\d{2})$/;

@Injectable()
export class ReconciliationService {
  constructor(
    private readonly getSummaryUseCase: GetReconciliationSummaryUseCase,
    private readonly getDuplicatesUseCase: GetReconciliationDuplicatesUseCase,
    private readonly getMismatchesUseCase: GetReconciliationMismatchesUseCase,
    private readonly getKpisUseCase: GetReconciliationKpisUseCase,
    private readonly getDiscrepanciesDetailUseCase: GetDiscrepanciesDetailUseCase,
  ) {}

  getSummary(mesLectura: string) {
    return this.getSummaryUseCase.execute(this.buildPeriod(mesLectura));
  }

  getDuplicates(mesLectura: string) {
    return this.getDuplicatesUseCase.execute(this.buildPeriod(mesLectura));
  }

  getMismatches(mesLectura: string) {
    return this.getMismatchesUseCase.execute(this.buildPeriod(mesLectura));
  }

  getKpis(mesLectura: string) {
    return this.getKpisUseCase.execute(this.buildPeriod(mesLectura));
  }

  getDiscrepanciesDetail(mesLectura: string, tipoFiltro: AuditoriaFiltroType) {
    return this.getDiscrepanciesDetailUseCase.execute({
      periodo: this.buildPeriod(mesLectura),
      tipo_filtro: tipoFiltro
    });
  }

  private buildPeriod(mesLectura: string): ReconciliationPeriod {
    const match = MES_LECTURA_PATTERN.exec(mesLectura ?? '');
    const mesNumero = match ? Number(match[2]) : NaN;
    const mesTexto = MONTHS[mesNumero];

    if (!match || !mesTexto) {
      throw new InvalidReconciliationPeriodException(mesLectura);
    }

    return { anio: match[1], mesTexto, mesLectura };
  }
}
