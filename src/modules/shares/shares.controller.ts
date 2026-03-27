import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SharesService } from './shares.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface RecordShareDto {
  museumId?: number;
  content?: string;
  images?: string[];
  type?: string;
  channel?: string;
}

@ApiTags('shares')
@Controller('shares')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '记录分享行为' })
  @ApiResponse({
    status: 201,
    description: '分享记录创建成功',
  })
  async recordShare(@Request() req: any, @Body() body: RecordShareDto) {
    const share = await this.sharesService.recordShare(req.user.userId, body);
    return {
      code: 0,
      data: {
        id: share.id,
        createdAt: share.createdAt,
      },
      message: '分享记录成功',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的分享列表' })
  @ApiResponse({
    status: 200,
    description: '返回用户分享列表',
  })
  async getMyShares(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    const result = await this.sharesService.getUserShares(
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