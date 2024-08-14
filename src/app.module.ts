import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { CommonModule } from './common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
