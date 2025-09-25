import { Module } from '@nestjs/common';
import { AppController } from './app/controller/app.controller';
import { AppService } from './app/service/app.service';
import { HomeModule } from './app/module/home.module';
import { ReadingModuleUsingSQLServer2022 } from './modules/readings/infrastructure/modules/reading.module';

@Module({
  imports: [HomeModule, ReadingModuleUsingSQLServer2022
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
