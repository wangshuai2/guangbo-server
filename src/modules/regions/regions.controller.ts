import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { CreateRegionDto, UpdateRegionDto, ToggleRegionDto, RegionType } from './dto/region.dto';

@ApiTags('regions')
@ApiBearerAuth()
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  // ==================== 用户端接口 ====================

  @Get()
  @ApiOperation({ summary: '获取地区列表' })
  @ApiQuery({ name: 'type', required: false, enum: RegionType })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: '返回地区列表' })
  findAll(
    @Query('type') type?: RegionType,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.regionsService.findAll(type, isActive);
  }

  @Get('tree')
  @ApiOperation({ summary: '获取地区树（省市区三级联动）' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: '返回地区树结构' })
  getRegionTree(@Query('isActive') isActive?: boolean) {
    return this.regionsService.getRegionTree(isActive);
  }

  @Get('provinces')
  @ApiOperation({ summary: '获取省份列表' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: '返回省份列表' })
  getProvinces(@Query('isActive') isActive?: boolean) {
    return this.regionsService.getProvinces(isActive);
  }

  @Get('provinces/:id/cities')
  @ApiOperation({ summary: '获取指定省份的城市列表' })
  @ApiResponse({ status: 200, description: '返回城市列表' })
  @ApiResponse({ status: 404, description: '省份不存在' })
  getCitiesByProvince(
    @Param('id', ParseIntPipe) provinceId: number,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.regionsService.getCitiesByProvince(provinceId, isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个地区详情' })
  @ApiResponse({ status: 200, description: '返回地区详情' })
  @ApiResponse({ status: 404, description: '地区不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.regionsService.findOne(id);
  }

  // ==================== 管理后台接口 ====================

  @Post('admin')
  @ApiOperation({ summary: '创建地区（管理后台）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 404, description: '父级地区不存在' })
  @ApiResponse({ status: 409, description: '行政区划代码已存在' })
  create(@Body() createRegionDto: CreateRegionDto) {
    return this.regionsService.create(createRegionDto);
  }

  @Put('admin/:id')
  @ApiOperation({ summary: '更新地区（管理后台）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '地区不存在' })
  @ApiResponse({ status: 409, description: '行政区划代码已存在或父级设置无效' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRegionDto: UpdateRegionDto) {
    return this.regionsService.update(id, updateRegionDto);
  }

  @Delete('admin/:id')
  @ApiOperation({ summary: '删除地区（管理后台，级联删除子地区）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '地区不存在' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.regionsService.remove(id);
  }

  @Post('admin/:id/toggle')
  @ApiOperation({ summary: '切换地区状态（管理后台）' })
  @ApiResponse({ status: 200, description: '切换成功' })
  @ApiResponse({ status: 404, description: '地区不存在' })
  toggle(@Param('id', ParseIntPipe) id: number, @Body() toggleDto: ToggleRegionDto) {
    return this.regionsService.toggle(id, toggleDto.isActive);
  }

  @Post('admin/cache/clear')
  @ApiOperation({ summary: '清除地区缓存（管理后台）' })
  @ApiResponse({ status: 200, description: '缓存已清除' })
  clearCache() {
    return this.regionsService.clearCache();
  }
}