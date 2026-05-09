import { Module } from '@nestjs/common';
import { AppController } from './app/controller/app.controller';
import { AppService } from './app/service/app.service';
import { HomeModule } from './app/module/home.module';
import { DatabasePersistenceModule } from './shared/connections/database/database-persistence.module';
import { environments } from './settings/environments/environments';
import { AppLegacyModulesUsingSQLServer2022 } from './factory/sqlserver/modules-using-sqlserver2022.module';
import { AppLegacyModulesUsingSQLServer2000 } from './factory/sqlserver/modules-using-sqlserver2000.module';

const legacyModules = environments.DATABASE_TYPE === 'sqlserver_2000'
  ? AppLegacyModulesUsingSQLServer2000
  : AppLegacyModulesUsingSQLServer2022;

@Module({
  imports: [
    HomeModule,
    legacyModules,
    DatabasePersistenceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
