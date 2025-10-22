import { Module } from '@nestjs/common';
import { AppController } from './app/controller/app.controller';
import { AppService } from './app/service/app.service';
import { HomeModule } from './app/module/home.module';
//import { ReadingModuleUsingSQLServer2022 } from './modules/readings/infrastructure/modules/reading-sqlserver2022.module';
import { ReadingModuleUsingSQLServer2000 } from './modules/readings/infrastructure/modules/reading.module';

@Module({
  imports: [HomeModule, ReadingModuleUsingSQLServer2000
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
