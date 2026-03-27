import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PosterService } from './poster.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('poster')
@Controller('poster')
export class PosterController {
  constructor(private readonly posterService: PosterService) {}

  @Get('user-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户海报数据' })
  @ApiResponse({
    status: 200,
    description: '返回用户海报数据，包含用户信息、统计数据、勋章、最近打卡等',
  })
  async getUserPosterData(@Request() req: any) {
    const data = await this.posterService.getPosterData(req.user.userId);
    return {
      code: 0,
      data,
    };
  }
}