import { HttpStatus } from '@nestjs/common';
import { CustomHttpException } from '../../../../shared/errors/exception/CustomHttpException';

export class MigrationFailedException extends CustomHttpException {
  constructor(reason: string) {
    super(
      `Migración de lecturas fallida: ${reason}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class ComparisonFailedException extends CustomHttpException {
  constructor(reason: string) {
    super(
      `Comparación de lecturas fallida: ${reason}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class ReconciliationFailedException extends CustomHttpException {
  constructor(reason: string) {
    super(
      `Reconciliación de lecturas fallida: ${reason}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class InvalidReconciliationPeriodException extends CustomHttpException {
  constructor(mesLectura: string) {
    super(
      `Periodo inválido "${mesLectura}": se esperaba el formato YYYY-MM`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
