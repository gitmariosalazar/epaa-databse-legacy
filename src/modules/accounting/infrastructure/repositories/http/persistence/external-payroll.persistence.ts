import { Injectable, Logger } from '@nestjs/common';
import { InterfaceExternalPayrollRepository } from '../../../../domain/contracts/external-payroll.interface.repository';
import {
  ExternalPayrollItem,
  ExternalPayrollResponse,
} from '../../../../domain/schemas/dto/response/external-payroll.response';
import { Agent, fetch } from 'undici'; // ← Importamos fetch explícitamente para evitar conflictos con los tipos de NodeJS

@Injectable()
export class ExternalPayrollPersistence
  implements InterfaceExternalPayrollRepository
{
  private readonly logger = new Logger(ExternalPayrollPersistence.name);
  private readonly baseUrl = 'http://181.112.159.150/api/commercial/payrolls';

  // Agent reutilizable con keepAlive (mejora el manejo de conexiones)
  private readonly httpAgent = new Agent({
    connections: 50, // equivalente a maxSockets en undici
    keepAliveTimeout: 30000, // 30 segundos
    connect: {
      timeout: 10000, // timeout de conexión
    },
  });

  async getPayrollsByIdentification(
    identification: string,
  ): Promise<ExternalPayrollItem[]> {
    const maxRetries = 2; // Reducido para evitar timeouts de Kafka (heartbeat de 30s)
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // Reducido a 6 segundos para fast-fail

        const url = `${this.baseUrl}?identification=${identification}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'NestJS-ExternalPayroll/1.0', // Recomendado
          },
          signal: controller.signal,
          dispatcher: this.httpAgent, // ← Usamos el agent
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          this.logger.warn(
            `External API error: Status ${response.status} for identification ${identification} (attempt ${attempt})`,
          );
          return [];
        }

        const result = (await response.json()) as ExternalPayrollResponse;

        if (result?.data?.success && Array.isArray(result.data.data)) {
          return result.data.data;
        }

        return [];
      } catch (error: any) {
        lastError = error;
        clearTimeout((error as any).timeoutId); // por si acaso

        const isNetworkError =
          error.name === 'AbortError' ||
          error.code === 'ECONNRESET' ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT' ||
          error.message?.includes('fetch failed');

        if (isNetworkError && attempt < maxRetries) {
          const delay = Math.min(
            1000 * Math.pow(2, attempt - 1) + Math.random() * 500,
            5000,
          );

          this.logger.warn(
            `ECONNRESET / network error for ${identification} (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`,
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Si no es reintentable o ya se acabaron los intentos
        this.logger.error(
          `Failed to fetch payrolls for identification ${identification} after ${attempt} attempts`,
          error,
        );
        return [];
      }
    }

    return [];
  }
}
