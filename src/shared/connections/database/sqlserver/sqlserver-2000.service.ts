import * as odbc from 'odbc';
import { DatabaseAbstract, IDatabaseClient, MutationResponse } from '../abstract/abstract.database';
import { RpcException } from '@nestjs/microservices';
import { environments } from '../../../../settings/environments/environments';
import { statusCode } from '../../../../settings/environments/status-code';

export class ODBCClientWrapper implements IDatabaseClient {
  constructor(private readonly connection: odbc.Connection) {}

  async query<T>(
    sql: string,
    params?: any[],
  ): Promise<T[]> {
    const safeParams = params || [];
    const result = await this.connection.query<T>(sql, safeParams);
    return Array.isArray(result) ? result : [];
  }

  async execute(sql: string, params?: any[]): Promise<MutationResponse> {
    const safeParams = params || [];
    const result = await this.connection.query(sql, safeParams);
    return {
      affectedRows: (result as any).count || 0,
    };
  }

  async release(): Promise<void> {
    await this.connection.close();
  }
}

export class DatabaseServiceSQLServer2000 extends DatabaseAbstract {
  private static pool: odbc.Pool | null = null;
  private isConnected = false;

  private readonly maxConnectionRetries = 1; // Reduced for non-fatal check
  private readonly connectionRetryDelayMs = 1000;
  private readonly maxQueryRetries = 3;
  private readonly queryRetryDelayMs = 500;
  private readonly queryTimeoutMs = 300000;

  constructor() {
    super();
  }

  public async connect(): Promise<void> {
    if (DatabaseServiceSQLServer2000.pool) {
      this.isConnected = true;
      return;
    }

    const connectionString = `DSN=SQLServer2000;UID=${environments.DATABASE_USER};PWD=${environments.DATABASE_PASSWORD};DATABASE=${environments.DATABASE_NAME};`;
    
    try {
      DatabaseServiceSQLServer2000.pool = await odbc.pool({
        connectionString,
        connectionTimeout: 10,
        loginTimeout: 5,
      });
      this.isConnected = true;
      console.log('🛢️ Connected to SQL Server 2000');
    } catch (err: any) {
      console.error('❌ SQL Server 2000 Connection Failed (Non-fatal at startup):', err.message);
      this.isConnected = false;
      DatabaseServiceSQLServer2000.pool = null;
    }
  }

  public async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.isConnected || !DatabaseServiceSQLServer2000.pool) {
        await this.connect();
        if (!this.isConnected) throw new RpcException({ statusCode: statusCode.INTERNAL_SERVER_ERROR, message: 'SQL Server 2000 is down' });
    }
    
    let lastError: any = null;
    for (let attempt = 1; attempt <= this.maxQueryRetries; attempt++) {
      let conn: odbc.Connection | null = null;
      try {
        conn = await DatabaseServiceSQLServer2000.pool!.connect();
        const result = await Promise.race([
          conn.query<T>(sql, params),
          new Promise<T[]>((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), this.queryTimeoutMs)
          )
        ]);
        return Array.isArray(result) ? result : [];
      } catch (err: any) {
        lastError = err;
        if (conn) {
            if (err.sqlState === '24000' || err.message.includes('Invalid cursor state')) {
                await conn.query('DEALLOCATE ALL CURSORS;').catch(() => {});
                await DatabaseServiceSQLServer2000.pool!.close().catch(() => {});
                DatabaseServiceSQLServer2000.pool = null;
                await this.connect();
            }
            await conn.close().catch(() => {});
        }
        if (attempt < this.maxQueryRetries) {
            await new Promise(r => setTimeout(r, this.queryRetryDelayMs * Math.pow(2, attempt)));
        }
      }
    }

    throw new RpcException({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: lastError?.message || 'Database query failed',
    });
  }

  public async execute(sql: string, params: any[] = []): Promise<MutationResponse> {
    if (!this.isConnected || !DatabaseServiceSQLServer2000.pool) {
        await this.connect();
        if (!this.isConnected) throw new RpcException({ statusCode: statusCode.INTERNAL_SERVER_ERROR, message: 'SQL Server 2000 is down' });
    }
    let conn: odbc.Connection | null = null;
    try {
      conn = await DatabaseServiceSQLServer2000.pool!.connect();
      const result = await conn.query(sql, params);
      return {
        affectedRows: (result as any).count || 0,
      };
    } catch (error) {
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    } finally {
      if (conn) await conn.close();
    }
  }

  public async transaction<T>(
    operations: (client: IDatabaseClient) => Promise<T>,
  ): Promise<T> {
    if (!this.isConnected || !DatabaseServiceSQLServer2000.pool) {
        await this.connect();
        if (!this.isConnected) throw new RpcException({ statusCode: statusCode.INTERNAL_SERVER_ERROR, message: 'SQL Server 2000 is down' });
    }
    const conn = await DatabaseServiceSQLServer2000.pool!.connect();
    try {
      await conn.query('BEGIN TRANSACTION');
      const wrapper = new ODBCClientWrapper(conn);
      const result = await operations(wrapper);
      await conn.query('COMMIT TRANSACTION');
      return result;
    } catch (error) {
      await conn.query('IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION');
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    } finally {
      await conn.close();
    }
  }

  public async getClient(): Promise<IDatabaseClient> {
    if (!this.isConnected || !DatabaseServiceSQLServer2000.pool) {
        await this.connect();
        if (!this.isConnected) throw new RpcException({ statusCode: statusCode.INTERNAL_SERVER_ERROR, message: 'SQL Server 2000 is down' });
    }
    const conn = await DatabaseServiceSQLServer2000.pool!.connect();
    return new ODBCClientWrapper(conn);
  }

  public async close(): Promise<void> {
    if (DatabaseServiceSQLServer2000.pool) {
      await DatabaseServiceSQLServer2000.pool.close();
      DatabaseServiceSQLServer2000.pool = null;
      this.isConnected = false;
    }
  }
}
