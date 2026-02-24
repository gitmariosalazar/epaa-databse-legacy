import * as odbc from 'odbc';
import { DatabaseAbstract } from '../abstract/abstract.database';
import { RpcException } from '@nestjs/microservices';
import { environments } from '../../../../settings/environments/environments';
import { statusCode } from '../../../../settings/environments/status-code';

class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class DatabaseServiceSQLServer2000 extends DatabaseAbstract {
  private static instance: DatabaseServiceSQLServer2000;

  /** Pool compartido para todo el módulo */
  private static pool: odbc.Pool | null = null;
  private isConnected = false;

  /** Reconexión y reintentos */
  private readonly maxConnectionRetries = 3;
  private readonly connectionRetryDelayMs = 1000;
  private readonly maxQueryRetries = 3;
  private readonly queryRetryDelayMs = 500;

  /** Timeout de queries */
  private readonly queryTimeoutMs = 10000;

  public constructor() {
    super();
    this.validateConfig();
    console.log('✅ DatabaseServiceSQLServer2000 initialized');
  }

  public static getInstance(): DatabaseServiceSQLServer2000 {
    if (!DatabaseServiceSQLServer2000.instance) {
      DatabaseServiceSQLServer2000.instance =
        new DatabaseServiceSQLServer2000();
    }
    return DatabaseServiceSQLServer2000.instance;
  }

  private validateConfig(): void {
    const requiredConfigs = {
      databaseUsername: environments.DATABASE_USER,
      databasePassword: environments.DATABASE_PASSWORD,
      databaseName: environments.DATABASE_NAME,
    };

    for (const [key, value] of Object.entries(requiredConfigs)) {
      if (!value) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: `Missing database configuration: ${key}`,
        });
      }
    }
  }

  public async onModuleInit(): Promise<void> {
    await this.connect();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  /** Conexión robusta con pool compartido y reintentos */
  public async connect(): Promise<void> {
    if (DatabaseServiceSQLServer2000.pool) {
      console.log('🟢 Already connected via pool');
      this.isConnected = true;
      return;
    }

    const connectionString = `DSN=SQLServer2000;UID=${environments.DATABASE_USER};PWD=${environments.DATABASE_PASSWORD};DATABASE=${environments.DATABASE_NAME};`;
    console.log(connectionString);
    for (let attempt = 1; attempt <= this.maxConnectionRetries; attempt++) {
      try {
        DatabaseServiceSQLServer2000.pool = await odbc.pool({
          connectionString,
          connectionTimeout: 10,
          loginTimeout: 5,
        });

        // Test rápido
        const test = await DatabaseServiceSQLServer2000.pool.query(
          'SELECT GETDATE() AS currentTime',
        );
        console.log('🛢️ Connected successfully. Server time:');
        this.isConnected = true;
        return;
      } catch (err: any) {
        console.error(
          `Attempt ${attempt}/${this.maxConnectionRetries} failed: ${err.message}`,
        );
        if (attempt === this.maxConnectionRetries)
          throw new RpcException({
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            message:
              'Could not connect to SQL Server 2000 after multiple attempts: ' +
              err.message,
          });
        await new Promise((r) =>
          setTimeout(r, this.connectionRetryDelayMs * Math.pow(2, attempt)),
        );
      }
    }
  }

  private validateQueryParams(sql: string, params: any[]): void {
    const placeholderCount = (sql.match(/\?/g) || []).length;
    if (placeholderCount !== params.length) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: `Mismatched parameter count. Expected ${placeholderCount}, got ${params.length}`,
      });
    }
  }

public async query<T>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = DatabaseServiceSQLServer2000.pool; 
  if (!pool) {
    throw new RpcException({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: 'Database pool no inicializado',
    });
  }

  // Validación de params
  if (params.length > 0) {
    const placeholderCount = (sql.match(/\?/g) || []).length;
    if (placeholderCount !== params.length) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: `Mismatched placeholders: ${placeholderCount} vs ${params.length} params`,
      });
    }
  }

  let lastError: any = null;
  let conn: odbc.Connection | null = null;

  for (let attempt = 1; attempt <= this.maxQueryRetries; attempt++) {
    try {
      conn = await pool.connect();

      // Limpieza preventiva fuerte
      await conn.query(`
        SET NOCOUNT ON;
        SET ANSI_NULLS ON;
        SET ANSI_WARNINGS ON;
        IF OBJECT_ID('tempdb..#dummy') IS NOT NULL DROP TABLE #dummy;
        SELECT 1 AS dummy INTO #dummy;
        DROP TABLE #dummy;
      `).catch(() => {}); // Ignorar fallos de limpieza

      // Ejecutar query con timeout más alto (ajusta según tu entorno: 30000–60000ms)
      const effectiveTimeout = this.queryTimeoutMs * 3; // ej: 30s si original es 10s
      const result = await Promise.race([
        conn.query<T>(sql, params),
        new Promise<T[]>((_, reject) => setTimeout(() => reject(new Error(`Query timeout después de ${effectiveTimeout}ms`)), effectiveTimeout)),
      ]);

      // Limpieza final
      await conn.query('SET NOCOUNT ON;').catch(() => {});

      await conn.close().catch(() => {});
      return Array.isArray(result) ? result : [];

    } catch (err: any) {
      lastError = err;

      // Logging detallado
      console.error(`[Query Attempt ${attempt}/${this.maxQueryRetries}]`, {
        message: err.message,
        sqlState: err.sqlState,
        code: err.code,
        odbcErrors: err.odbcErrors || err.errors,
        stack: err.stack?.substring(0, 800),
        sqlSnippet: sql.substring(0, 400) + (sql.length > 400 ? '...' : ''),
      });

      if (conn) {
        try {
          // Limpieza desesperada si detectamos cursor inválido
          if (err.sqlState === '24000' || err.message.includes('Invalid cursor state')) {
            await conn.query('DEALLOCATE ALL CURSORS;').catch(() => {});
          }
          await conn.close().catch(() => {});
        } catch (closeErr) {
          console.warn('Error cerrando conexión sucia:', closeErr.message);
        }
      }

      // Si es cursor inválido → fuerza reconexión del pool
      if (err.sqlState === '24000' || err.message.includes('Invalid cursor state')) {
        console.warn('Invalid cursor state detectado → forzando reconexión del pool');
        if (DatabaseServiceSQLServer2000.pool) {
          await DatabaseServiceSQLServer2000.pool.close().catch(() => {});
          DatabaseServiceSQLServer2000.pool = null;
        }
        await this.connect(); // reconecta el pool completo
      }

      if (attempt < this.maxQueryRetries) {
        const delay = this.queryRetryDelayMs * Math.pow(2, attempt);
        console.log(`Reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new RpcException({
    statusCode: statusCode.INTERNAL_SERVER_ERROR,
    message: `Fallo después de ${this.maxQueryRetries} intentos. Último error: ${lastError?.message || 'Desconocido'}`,
    cause: lastError,
  });
}

  public async transaction<T>(
    operations: (conn: odbc.Connection) => Promise<T>,
  ): Promise<T> {
    if (!DatabaseServiceSQLServer2000.pool)
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Database is not connected',
      });
    for (let attempt = 1; attempt <= this.maxQueryRetries; attempt++) {
      const conn = await DatabaseServiceSQLServer2000.pool.connect();
      try {
        await conn.beginTransaction();
        const result = await operations(conn);
        await conn.commit();
        await conn.close();
        return result;
      } catch (err: any) {
        try {
          await conn.rollback();
        } catch (_) {
          /* ignore */
        }
        await conn.close();
        if (attempt === this.maxQueryRetries)
          throw new RpcException({
            statusCode: statusCode.INTERNAL_SERVER_ERROR,
            message: `Database error: ${err.message}`,
          });
        await new Promise((r) =>
          setTimeout(r, this.queryRetryDelayMs * Math.pow(2, attempt)),
        );
      }
    }
    throw new RpcException({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: 'Transaction failed after maximum retries',
    });
  }

  /** Cierra el pool global */
  public async close(): Promise<void> {
    if (DatabaseServiceSQLServer2000.pool) {
      await DatabaseServiceSQLServer2000.pool.close();
      DatabaseServiceSQLServer2000.pool = null;
      this.isConnected = false;
      console.log('🔒 Database pool closed');
    } else {
      console.log('⚪ Database pool already closed');
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
