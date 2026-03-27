import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MedalsService } from './medals.service';
import {
  CreateMedalDto,
  UpdateMedalDto,
  ToggleMedalDto,
} from './dto/medal.dto';

@ApiTags('medals')
@ApiBearerAuth()
@Controller('medals')
export class MedalsController {
  constructor(private readonly medalsService: MedalsService) {}

  // ==================== 用户端接口 ====================

  @Get()
  @ApiOperation({ summary: '获取勋章列表（用户端）' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: '返回勋章列表' })
  findAll(@Query('isActive') isActive?: boolean) {
    return this.medalsService.findAll(isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个勋章详情' })
  @ApiResponse({ status: 200, description: '返回勋章详情' })
  @ApiResponse({ status: 404, description: '勋章不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.medalsService.findOne(id);
  }

  // ==================== 管理后台接口 ====================

  @Post('admin')
  @ApiOperation({ summary: '创建勋章（管理后台）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '勋章类型和等级已存在' })
  create(@Body() createMedalDto: CreateMedalDto) {
    return this.medalsService.create(createMedalDto);
  }

  @Put('admin/:id')
  @ApiOperation({ summary: '更新勋章（管理后台）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '勋章不存在' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMedalDto: UpdateMedalDto,
  ) {
    return this.medalsService.update(id, updateMedalDto);
  }

  @Delete('admin/:id')
  @ApiOperation({ summary: '删除勋章（管理后台）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '勋章不存在' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.medalsService.remove(id);
  }

  @Post('admin/:id/toggle')
  @ApiOperation({ summary: '切换勋章状态（管理后台）' })
  @ApiResponse({ status: 200, description: '切换成功' })
  @ApiResponse({ status: 404, description: '勋章不存在' })
  toggle(
    @Param('id', ParseIntPipe) id: number,
    @Body() toggleDto: ToggleMedalDto,
  ) {
    return this.medalsService.toggle(id, toggleDto.isActive);
  }
}
