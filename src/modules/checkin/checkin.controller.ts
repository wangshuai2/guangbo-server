import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CheckinService } from './checkin.service';
import {
  CreateCheckinDto,
  CheckinQueryDto,
} from './dto/create-checkin.dto';

@ApiTags('打卡')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post()
  @ApiOperation({ summary: '打卡', description: '在博物馆附近打卡' })
  async checkin(@Request() req: any, @Body() dto: CreateCheckinDto) {
    return this.checkinService.checkin(Number(req.user.id), dto);
  }

  @Get('history')
  @ApiOperation({ summary: '获取打卡记录', description: '获取用户打卡历史' })
  async getHistory(@Request() req: any, @Query() query: CheckinQueryDto) {
    return this.checkinService.getHistory(Number(req.user.id), query);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取打卡统计', description: '获取用户打卡统计数据' })
  async getStatistics(@Request() req: any) {
    return this.checkinService.getStatistics(Number(req.user.id));
  }
}