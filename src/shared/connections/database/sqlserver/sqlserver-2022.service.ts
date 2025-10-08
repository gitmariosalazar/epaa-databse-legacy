import { ConnectionPool, IResult, config, Transaction } from 'mssql';
import { DatabaseAbstract } from '../abstract/abstract.database';
import { environments } from 'src/settings/environments/environments';

class DatabaseError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class DatabaseServiceSQLServer2022 extends DatabaseAbstract {
  private static instance: DatabaseServiceSQLServer2022;
  private pool: ConnectionPool;
  private isConnected: boolean = false;
  private readonly maxRetries: number = 3;
  private readonly retryDelayMs: number = 1000;
  private readonly queryTimeoutMs: number = 10000;

  public constructor() {
    super();
    this.validateConfig();
    console.log(environments.DATABASE_HOST, environments.DATABASE_NAME, environments.DATABASE_PASSWORD, environments.DATABASE_PORT, environments.DATABASE_USER)
    const poolConfig: config = {
      user: environments.DATABASE_USER,
      password: environments.DATABASE_PASSWORD,
      server: environments.DATABASE_HOST,
      database: environments.DATABASE_NAME,
      port: environments.DATABASE_PORT,
      pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 30000
      },
      options: {
        encrypt: false,
        trustServerCertificate: true,
        requestTimeout: 2000
      }
    };

    this.pool = new ConnectionPool(poolConfig);
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      this.isConnected = false;
    });
  }

  public static getInstance(): DatabaseServiceSQLServer2022 {
    if (!DatabaseServiceSQLServer2022.instance) {
      DatabaseServiceSQLServer2022.instance = new DatabaseServiceSQLServer2022();
    }
    return DatabaseServiceSQLServer2022.instance;
  }

  private validateConfig(): void {
    const requiredConfigs = {
      databaseUsername: environments.DATABASE_USER,
      databaseHostname: environments.DATABASE_HOST,
      databasePassword: environments.DATABASE_PASSWORD,
      databaseName: environments.DATABASE_NAME,
      databasePort: environments.DATABASE_PORT
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
      try {
        await this.pool.connect();
        await this.pool.request().query('SELECT GETDATE()');
        this.isConnected = true;
        console.log('🛢️ Connected to SQL Server successfully 🎉!');
        return;
      } catch (error) {
        const errorMessage = `Attempt ${attempt}/${this.maxRetries} - Failed to connect to SQL Server: ${error.message}`;
        console.error(errorMessage);

        if (attempt === this.maxRetries) {
          throw new DatabaseError('Database connection failed after maximum retries', error.code);
        }

        await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * Math.pow(2, attempt)));
      }
    }
  }

  public async transaction<T>(operations: (request: Request) => Promise<T>): Promise<T> {
    if (!this.isConnected) throw new DatabaseError('Database is not connected');
    const transaction = new Transaction(this.pool);
    await transaction.begin();

    try {
      const request = new Request(transaction);
      const result = await operations(request);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      const errorMessage = `Transaction failed: ${error.message}`;
      console.error(errorMessage);
      throw new DatabaseError(errorMessage, error.code);
    }
  }

  public async query<T>(sql: string, params: { name: string; value: any }[] = []): Promise<T[]> {
    if (!this.isConnected) {
      throw new DatabaseError('Database is not connected');
    }

    try {
      const request = this.pool.request();
      params.forEach(param => {
        request.input(param.name, param.value);
      });

      const result: IResult<T> = await Promise.race([
        request.query<T>(sql),
        new Promise((_, reject) =>
          setTimeout(() => reject(new DatabaseError('Query timeout')), this.queryTimeoutMs)
        )
      ]) as IResult<T>;

      console.log(`Query executed successfully: ${sql.slice(0, 50)}...`);
      return result.recordset;
    } catch (error) {
      const errorMessage = `Database query failed: ${error.message}`;
      console.error(errorMessage, { sql, params });
      throw new DatabaseError(errorMessage, error.code);
    }
  }


  public async close(): Promise<void> {
    if (!this.isConnected) {
      console.log('Database connection already closed');
      return;
    }

    try {
      await this.pool.close();
      this.isConnected = false;
      console.log('Database connection closed successfully');
    } catch (error) {
      console.error(`Failed to close database connection: ${error.message}`);
      throw new DatabaseError('Failed to close database connection', error.code);
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
