import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async getCurrentUser(@Request() req: any) {
    const user = await this.usersService.getUserProfile(req.user.userId);
    return {
      code: 0,
      data: user,
    };
  }

  @Get('me/level')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户等级信息' })
  async getUserLevel(@Request() req: any) {
    const levelInfo = await this.usersService.getUserLevelInfo(req.user.userId);
    return {
      code: 0,
      data: levelInfo,
    };
  }

  @Get('me/medals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户勋章列表' })
  async getUserMedals(@Request() req: any) {
    const medals = await this.usersService.getUserMedals(req.user.userId);
    return {
      code: 0,
      data: medals,
    };
  }

  @Get('me/footprints')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户打卡记录时间线' })
  async getUserFootprints(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    const result = await this.usersService.getUserFootprints(
      req.user.userId,
      Number(page),
      Number(pageSize),
    );
    return {
      code: 0,
      data: result,
    };
  }

  @Get('me/collections')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户收藏博物馆列表' })
  async getUserCollections(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    const result = await this.usersService.getUserCollections(
      req.user.userId,
      Number(page),
      Number(pageSize),
    );
    return {
      code: 0,
      data: result,
    };
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户统计数据' })
  async getUserStats(@Request() req: any) {
    const stats = await this.usersService.getUserStats(req.user.userId);
    return {
      code: 0,
      data: stats,
    };
  }
}