// test-sql2000.ts
/*
import * as odbc from 'odbc';

(async () => {
  const connectionString = 'DSN=SQLServer2000;UID=sa;PWD=hppml350;';

  try {
    const connection = await odbc.connect(connectionString);

    // Simple test: get server date
    const result = await connection.query('SELECT GETDATE() AS now');

    console.log('✅ Connected to SQL Server 2000');
    console.log(result);

    await connection.close();
  } catch (err: any) {
    console.error('❌ Connection failed:', err.message);
  }
})();
*/