import { Global, Module } from '@nestjs/common';
import { DatabaseAbstract } from './abstract/abstract.database';
import { DatabaseServiceSQLServer2000 } from './sqlserver/sqlserver-2000.service';
import { DatabaseServiceSQLServer2022 } from './sqlserver/sqlserver-2022.service';
import { environments } from '../../../settings/environments/environments';

@Global()
@Module({
  providers: [
    {
      provide: DatabaseAbstract,
      useFactory: () => {
        const type = environments.DATABASE_TYPE;
        if (type === 'sqlserver_2000') {
          return new DatabaseServiceSQLServer2000();
        }
        return new DatabaseServiceSQLServer2022();
      },
    },
  ],
  exports: [DatabaseAbstract],
})
export class DatabasePersistenceModule {}
