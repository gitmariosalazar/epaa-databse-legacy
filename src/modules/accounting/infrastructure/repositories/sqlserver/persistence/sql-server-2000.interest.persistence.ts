import { Injectable, Logger } from '@nestjs/common';
import { IInterestRepository } from '../../../../domain/contracts/interest.interface.repository';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';

class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

@Injectable()
export class SqlServer2000InterestPersistence implements IInterestRepository {
  private readonly logger = new Logger(SqlServer2000InterestPersistence.name);

  constructor(private readonly sqlServerService: DatabaseAbstract) {}

  async executeDailyInterestUpdate(): Promise<void> {
    const queryExecute = 'EXEC sp_ActualizarInteresesDiarios;';

    try {
      this.logger.log('Iniciando ejecución de sp_ActualizarInteresesDiarios en SQL Server 2000...');
      const result = await this.sqlServerService.execute(queryExecute);
      this.logger.log(
        `sp_ActualizarInteresesDiarios finalizado con éxito. Registros afectados: ${result?.affectedRows ?? 0}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Error al ejecutar sp_ActualizarInteresesDiarios en SQL Server 2000: ${error.message}`,
        {
          error,
          query: queryExecute,
        },
      );
      throw new DatabaseError(
        `Failed to execute daily interest update: ${error.message}`,
        error.code,
      );
    }
  }
}
