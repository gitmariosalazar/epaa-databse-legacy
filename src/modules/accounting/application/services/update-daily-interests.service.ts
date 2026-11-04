import { Inject, Injectable, Logger } from '@nestjs/common';
import { IInterestRepository } from '../../domain/contracts/interest.interface.repository';
import { InterestExecutionException } from '../../domain/exceptions/interest-execution.exception';
import { IUpdateDailyInterestsUseCase } from '../usecases/interest.use-case.interface';
import { InterestExecutionResult } from '../../domain/schemas/model/interest-execution-result.model';

@Injectable()
export class UpdateDailyInterestsService implements IUpdateDailyInterestsUseCase {
  private readonly logger = new Logger(UpdateDailyInterestsService.name);

  constructor(
    @Inject('IInterestRepository')
    private readonly interestRepository: IInterestRepository,
  ) {}

  async execute(): Promise<InterestExecutionResult> {
    try {
      this.logger.log('Iniciando ejecución de actualización de intereses...');
      await this.interestRepository.executeDailyInterestUpdate();
      this.logger.log('Actualización de intereses finalizada exitosamente.');
      return new InterestExecutionResult(
        new Date(),
        true,
        'Procedimiento sp_ActualizarInteresesDiarios ejecutado exitosamente.',
      );
    } catch (error) {
      this.logger.error(
        'Fallo al ejecutar la actualización de intereses',
        error,
      );
      throw new InterestExecutionException(
        'Error al procesar el procedimiento de intereses',
        error,
      );
    }
  }
}
