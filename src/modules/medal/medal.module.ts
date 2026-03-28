import { Module } from '@nestjs/common';
import { MedalController } from './medal.controller';
import { MedalService } from './medal.service';
import { MedalCheckerService } from './medal-checker.service';

@Module({
  controllers: [MedalController],
  providers: [MedalService, MedalCheckerService],
  exports: [MedalService, MedalCheckerService],
})
export class MedalModule {}