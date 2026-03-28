import { Module } from '@nestjs/common';
import { DailyCheckinController } from './daily-checkin.controller';
import { DailyCheckinService } from './daily-checkin.service';

@Module({
  controllers: [DailyCheckinController],
  providers: [DailyCheckinService],
  exports: [DailyCheckinService],
})
export class DailyCheckinModule {}