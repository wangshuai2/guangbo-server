import { Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DailyCheckinService } from './daily-checkin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('daily-checkin')
@Controller('daily-checkin')
export class DailyCheckinController {
  constructor(private readonly dailyCheckinService: DailyCheckinService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '每日签到' })
  async checkin(@Request() req: any) {
    const result = await this.dailyCheckinService.checkin(req.user.userId);
    return {
      code: result.success ? 0 : 1,
      data: result.data,
      message: result.message,
    };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取签到状态' })
  async getCheckinStatus(@Request() req: any) {
    const status = await this.dailyCheckinService.getCheckinStatus(req.user.userId);
    return {
      code: 0,
      data: status,
    };
  }

  @Get('calendar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取签到日历' })
  async getCheckinCalendar(
    @Request() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const now = new Date();
    const y = year ? Number(year) : now.getFullYear();
    const m = month ? Number(month) : now.getMonth() + 1;

    const calendar = await this.dailyCheckinService.getCheckinCalendar(req.user.userId, y, m);
    return {
      code: 0,
      data: calendar,
    };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取签到历史记录' })
  async getCheckinHistory(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '30',
  ) {
    const result = await this.dailyCheckinService.getCheckinHistory(
      req.user.userId,
      Number(page),
      Number(pageSize),
    );
    return {
      code: 0,
      data: result,
    };
  }
}