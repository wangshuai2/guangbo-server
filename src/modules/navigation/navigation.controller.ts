import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NavigationService } from './navigation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('navigation')
@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get('museums/:museumId')
  @ApiOperation({ summary: '获取博物馆导航信息' })
  @ApiQuery({ name: 'userLat', required: false, description: '用户纬度' })
  @ApiQuery({ name: 'userLng', required: false, description: '用户经度' })
  async getNavigationInfo(
    @Param('museumId') museumId: string,
    @Query('userLat') userLat?: string,
    @Query('userLng') userLng?: string,
  ) {
    const result = await this.navigationService.getNavigationInfo({
      museumId: Number(museumId),
      userLat: userLat ? Number(userLat) : undefined,
      userLng: userLng ? Number(userLng) : undefined,
    });
    return {
      code: 0,
      data: result,
    };
  }

  @Get('batch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量获取博物馆导航信息' })
  async getBatchNavigationInfo(
    @Query('museumIds') museumIds: string,
    @Query('userLat') userLat?: string,
    @Query('userLng') userLng?: string,
  ) {
    const ids = museumIds.split(',').map(Number);
    const result = await this.navigationService.getBatchNavigationInfo(
      ids,
      userLat ? Number(userLat) : undefined,
      userLng ? Number(userLng) : undefined,
    );
    return {
      code: 0,
      data: result,
    };
  }
}