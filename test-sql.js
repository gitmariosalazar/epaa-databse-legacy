const sql = require('mssql');
const config = {
  user: process.env.DATABASE_USER || 'sa',
  password: process.env.DATABASE_PASSWORD || 'your_password',
  server: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'epaa',
  options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query(`
      DECLARE @d DATETIME;
      BEGIN TRY
        SET @d = CONVERT(DATETIME, '2026-05-01 00:00:00.000', 120);
        SELECT @d as d;
      END TRY
      BEGIN CATCH
        SELECT 'ERROR' as d, ERROR_MESSAGE() as msg;
      END CATCH
    `);
    console.log(result.recordset);
  } catch (err) {
    console.error(err);
  }
}
run();
