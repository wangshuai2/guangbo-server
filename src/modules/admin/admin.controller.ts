import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Query,
  Param,
  ParseIntPipe,
  Delete,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { MuseumService } from './museum.service';
import { UserManageService } from './user-manage.service';
import { StatsService } from './stats.service';
import { AdminLoginDto, CreateAdminDto } from './dto/admin.dto';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly museumService: MuseumService,
    private readonly userManageService: UserManageService,
    private readonly statsService: StatsService,
  ) {}

  // ==================== 认证相关 ====================

  @Post('auth/login')
  @ApiOperation({ summary: '管理员登录' })
  @ApiResponse({ status: 201, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto);
  }

  @Get('auth/profile')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取管理员信息' })
  async getProfile(@Request() req: any) {
    return this.adminService.getProfile(req.admin.id);
  }

  @Post('auth/init')
  @ApiOperation({ summary: '初始化超级管理员' })
  async initSuperAdmin() {
    return this.adminService.initSuperAdmin();
  }

  // ==================== 博物馆管理 ====================

  @Get('museums')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '博物馆列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  async getMuseums(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
  ) {
    return this.museumService.findAll(page, pageSize, keyword);
  }

  @Get('museums/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '博物馆详情' })
  async getMuseum(@Param('id', ParseIntPipe) id: number) {
    return this.museumService.findOne(id);
  }

  @Post('museums')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建博物馆' })
  async createMuseum(@Body() data: any) {
    return this.museumService.create(data);
  }

  @Put('museums/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新博物馆' })
  async updateMuseum(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.museumService.update(id, data);
  }

  @Delete('museums/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除博物馆' })
  async deleteMuseum(@Param('id', ParseIntPipe) id: number) {
    return this.museumService.remove(id);
  }

  @Post('museums/:id/toggle')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '切换博物馆状态' })
  async toggleMuseum(@Param('id', ParseIntPipe) id: number) {
    return this.museumService.toggle(id);
  }

  // ==================== 用户管理 ====================

  @Get('users')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  async getUsers(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
  ) {
    return this.userManageService.findAll(page, pageSize, keyword);
  }

  @Get('users/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户详情' })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return this.userManageService.findOne(id);
  }

  @Put('users/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户' })
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.userManageService.update(id, data);
  }

  @Post('users/:id/ban')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '封禁用户' })
  async banUser(@Param('id', ParseIntPipe) id: number) {
    return this.userManageService.ban(id);
  }

  // ==================== 数据统计 ====================

  @Get('stats/overview')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '概览数据' })
  async getStatsOverview() {
    return this.statsService.getOverview();
  }

  @Get('stats/footprints')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '打卡统计' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getFootprintStats(@Query('days') days?: number) {
    return this.statsService.getFootprintStats(days);
  }

  @Get('stats/medals')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '勋章统计' })
  async getMedalStats() {
    return this.statsService.getMedalStats();
  }

  @Get('stats/hot-museums')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '热门博物馆' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHotMuseums(@Query('limit') limit?: number) {
    return this.statsService.getHotMuseums(limit);
  }
}
