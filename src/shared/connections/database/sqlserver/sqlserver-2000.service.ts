import * as odbc from 'odbc';
import { DatabaseAbstract } from '../abstract/abstract.database';
import { environments } from 'src/settings/environments/environments';

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
        throw new DatabaseError(`Missing required configuration: ${key}`);
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
          throw new DatabaseError(
            'Database connection failed after retries',
            err.code,
          );
        await new Promise((r) =>
          setTimeout(r, this.connectionRetryDelayMs * Math.pow(2, attempt)),
        );
      }
    }
  }

  private validateQueryParams(sql: string, params: any[]): void {
    const placeholderCount = (sql.match(/\?/g) || []).length;
    if (placeholderCount !== params.length) {
      throw new DatabaseError(
        `Mismatched parameter count. Expected ${placeholderCount}, got ${params.length}`,
      );
    }
  }

  public async query<T>(sql: string): Promise<T[]> {
    if (!DatabaseServiceSQLServer2000.pool) {
      throw new DatabaseError('Database is not connected');
    }

    for (let attempt = 1; attempt <= this.maxQueryRetries; attempt++) {
      const conn = await DatabaseServiceSQLServer2000.pool.connect();
      try {
        const result = await Promise.race([
          conn.query<T>(sql, []),
          new Promise<T[]>((_, reject) =>
            setTimeout(
              () => reject(new DatabaseError('Query timeout')),
              this.queryTimeoutMs,
            ),
          ),
        ]);
        await conn.close();
        return result as T[];
      } catch (err: any) {
        console.error('ODBC Error Details:', {
          message: err.message,
          sqlState: err.sqlState,
          code: err.code,
          sql,
          stack: err.stack,
        });
        await conn.close();
        if (attempt === this.maxQueryRetries) {
          throw new DatabaseError(
            `Failed to execute query: ${err.message}`,
            err.sqlState || err.code,
          );
        }
        await new Promise((r) =>
          setTimeout(r, this.queryRetryDelayMs * Math.pow(2, attempt)),
        );
      }
    }
    throw new DatabaseError('Query failed after maximum retries');
  }

  public async transaction<T>(
    operations: (conn: odbc.Connection) => Promise<T>,
  ): Promise<T> {
    if (!DatabaseServiceSQLServer2000.pool)
      throw new DatabaseError('Database is not connected');
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
          throw new DatabaseError(err.message, err.code);
        await new Promise((r) =>
          setTimeout(r, this.queryRetryDelayMs * Math.pow(2, attempt)),
        );
      }
    }
    throw new DatabaseError('Transaction failed after maximum retries');
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
