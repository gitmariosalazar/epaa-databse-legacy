import { ConnectionPool, Transaction, Request, config } from 'mssql';
import { DatabaseAbstract, IDatabaseClient, MutationResponse } from '../abstract/abstract.database';
import { RpcException } from '@nestjs/microservices';
import { environments } from '../../../../settings/environments/environments';
import { statusCode } from '../../../../settings/environments/status-code';

export class MSSQLClientWrapper implements IDatabaseClient {
  constructor(private readonly poolOrTransaction: ConnectionPool | Transaction) {}

  async query<T>(
    sql: string,
    params?: any[],
  ): Promise<T[]> {
    const request = new Request(this.poolOrTransaction);
    let translatedSql = sql;

    if (params && params.length > 0) {
      params.forEach((param, idx) => {
        if (param && typeof param === 'object' && 'name' in param && 'value' in param) {
          request.input(param.name, param.value);
        } else {
          const paramName = `p${idx}`;
          request.input(paramName, param);
          translatedSql = translatedSql.replace('?', `@${paramName}`);
        }
      });
    }

    const result = await request.query<T>(translatedSql);
    return result.recordset;
  }

  async execute(sql: string, params?: any[]): Promise<MutationResponse> {
    const request = new Request(this.poolOrTransaction);
    let translatedSql = sql;
    if (params && params.length > 0) {
      params.forEach((param, idx) => {
        if (param && typeof param === 'object' && 'name' in param && 'value' in param) {
          request.input(param.name, param.value);
        } else {
          const paramName = `p${idx}`;
          request.input(paramName, param);
          translatedSql = translatedSql.replace('?', `@${paramName}`);
        }
      });
    }
    const result = await request.query(translatedSql);
    return {
      affectedRows: result.rowsAffected[0] || 0,
    };
  }

  async release(): Promise<void> {
  }
}

export class DatabaseServiceSQLServer2022 extends DatabaseAbstract {
  private pool: ConnectionPool;
  private isConnected: boolean = false;

  constructor() {
    super();
    const poolConfig: config = {
      user: environments.DATABASE_USER,
      password: environments.DATABASE_PASSWORD,
      server: environments.DATABASE_HOST,
      database: environments.DATABASE_NAME,
      port: Number(environments.DATABASE_PORT),
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      connectionTimeout: 5000,
    };
    this.pool = new ConnectionPool(poolConfig);
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;
    try {
      await this.pool.connect();
      this.isConnected = true;
      console.log('🛢️ Connected to SQL Server 2022');
    } catch (error) {
      console.error('❌ SQL Server 2022 Connection Failed (Non-fatal at startup):', error.message);
      this.isConnected = false;
    }
  }

  public async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.isConnected) {
        await this.connect();
        if (!this.isConnected) throw new RpcException({ statusCode: statusCode.INTERNAL_SERVER_ERROR, message: 'SQL Server 2022 is down' });
    }
    const client = new MSSQLClientWrapper(this.pool);
    return await client.query<T>(sql, params);
  }

  public async execute(sql: string, params: any[] = []): Promise<MutationResponse> {
    if (!this.isConnected) {
        await this.connect();
        if (!this.isConnected) throw new RpcException({ statusCode: statusCode.INTERNAL_SERVER_ERROR, message: 'SQL Server 2022 is down' });
    }
    const client = new MSSQLClientWrapper(this.pool);
    return await client.execute(sql, params);
  }

  public async transaction<T>(
    operations: (client: IDatabaseClient) => Promise<T>,
  ): Promise<T> {
    if (!this.isConnected) {
        await this.connect();
        if (!this.isConnected) throw new RpcException({ statusCode: statusCode.INTERNAL_SERVER_ERROR, message: 'SQL Server 2022 is down' });
    }
    const transaction = new Transaction(this.pool);
    try {
      await transaction.begin();
      const wrapper = new MSSQLClientWrapper(transaction);
      const result = await operations(wrapper);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  public async getClient(): Promise<IDatabaseClient> {
    if (!this.isConnected) {
        await this.connect();
        if (!this.isConnected) throw new RpcException({ statusCode: statusCode.INTERNAL_SERVER_ERROR, message: 'SQL Server 2022 is down' });
    }
    return new MSSQLClientWrapper(this.pool);
  }

  public async close(): Promise<void> {
    await this.pool.close();
    this.isConnected = false;
  }
}
