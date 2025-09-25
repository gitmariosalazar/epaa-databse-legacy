import { ConnectionPool, config } from 'mssql';

(async () => {
  const poolConfig: config = {
    user: 'mario',
    password: 'password-sqlmario',
    server: '172.19.48.1',
    database: 'BDDEpaaDesarrollo',
    port: 1433,
    options: {
      instanceName: 'SQLEXPRESS2022',
      encrypt: false,
      trustServerCertificate: true,
      requestTimeout: 2000
    }
  };

  try {
    const pool = new ConnectionPool(poolConfig);
    await pool.connect();
    const result = await pool.request().query('SELECT GETDATE() as now');
    console.log(result.recordset);
  } catch (err) {
    console.error('Connection failed:', err);
  }
})();
