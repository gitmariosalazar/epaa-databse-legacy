import { Module } from '@nestjs/common';
import { AppController } from './app/controller/app.controller';
import { AppService } from './app/service/app.service';
import { HomeModule } from './app/module/home.module';
//import { ModulesUsingSQLServer2022Module } from './factory/sqlserver/modules-using-sqlserver2022.module';
import { ModulesUsingSQLServer2000Module } from './factory/sqlserver/modules-using-sqlserver2000.module';
@Module({
  imports: [
    HomeModule,
    ModulesUsingSQLServer2000Module,
    //ModulesUsingSQLServer2022Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
