import * as odbc from 'odbc';
import { DatabaseAbstract } from '../abstract/abstract.database';
import { environments } from 'src/settings/environments/environments';

class DatabaseError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class DatabaseServiceSQLServer2000 extends DatabaseAbstract {
  private static instance: DatabaseServiceSQLServer2000;
  private connectionString: string;
  private isConnected: boolean = false;
  private readonly maxRetries: number = 3;
  private readonly retryDelayMs: number = 1000;
  private readonly queryTimeoutMs: number = 10000;

  public constructor() {
    super();
    this.validateConfig();

    // Usar DSN que funciona con isql
    this.connectionString = `DSN=SQLServer2000;UID=${environments.DATABASE_USER};PWD=${environments.DATABASE_PASSWORD};`;

    console.log('Connection String:', this.connectionString.replace(environments.DATABASE_PASSWORD, '****'));
  }

  public static getInstance(): DatabaseServiceSQLServer2000 {
    if (!DatabaseServiceSQLServer2000.instance) {
      DatabaseServiceSQLServer2000.instance = new DatabaseServiceSQLServer2000();
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

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Already connected to SQL Server');
      return;
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      let connection: odbc.Connection | null = null;
      try {
        connection = await odbc.connect(this.connectionString);
        await connection.query('SELECT GETDATE() AS currentTime');
        this.isConnected = true;
        console.log('🛢️ Connected to SQL Server 2000 via ODBC successfully 🎉!');
        return;
      } catch (error) {
        const errorMessage = `Attempt ${attempt}/${this.maxRetries} - Failed to connect to SQL Server: ${error.message}`;
        console.error(errorMessage, { code: error.code, state: error.state });
        if (attempt === this.maxRetries) {
          throw new DatabaseError('Database connection failed after maximum retries', error.code);
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * Math.pow(2, attempt)));
      } finally {
        if (connection) {
          try {
            await connection.close();
          } catch (closeError) {
            console.error('Error closing test connection:', closeError.message);
          }
        }
      }
    }
  }

  public async transaction<T>(operations: (connection: odbc.Connection) => Promise<T>): Promise<T> {
    if (!this.isConnected) {
      throw new DatabaseError('Database is not connected');
    }

    const connection = await odbc.connect(this.connectionString);
    try {
      await connection.query('SET XACT_ABORT ON; BEGIN TRANSACTION');
      const result = await operations(connection);
      await connection.query('COMMIT TRANSACTION');
      return result;
    } catch (error) {
      await connection.query('ROLLBACK TRANSACTION');
      const errorMessage = `Transaction failed: ${error.message}`;
      console.error(errorMessage, { code: error.code, state: error.state });
      throw new DatabaseError(errorMessage, error.code);
    } finally {
      await connection.close();
    }
  }

  public async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.isConnected) {
      throw new DatabaseError('Database is not connected');
    }

    const connection = await odbc.connect(this.connectionString);
    try {
      const result = await Promise.race([
        connection.query<T>(sql, params),
        new Promise((_, reject) =>
          setTimeout(() => reject(new DatabaseError('Query timeout')), this.queryTimeoutMs)
        ),
      ]);

      console.log(`Query executed successfully: ${sql.slice(0, 50)}...`);
      return result as T[];
    } catch (error) {
      const errorMessage = `Database query failed: ${error.message}`;
      console.error(errorMessage, { sql, params, code: error.code, state: error.state });
      throw new DatabaseError(errorMessage, error.code);
    } finally {
      await connection.close();
    }
  }

  public async close(): Promise<void> {
    if (!this.isConnected) {
      console.log('Database connection already closed');
      return;
    }
    this.isConnected = false;
    console.log('Database connection closed successfully');
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}