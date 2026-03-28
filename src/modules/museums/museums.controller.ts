import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MuseumsService } from './museums.service';
import { QueryMuseumDto } from './dto/query-museum.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('博物馆')
@Controller('v1/museums')
export class MuseumsController {
  constructor(private readonly museumsService: MuseumsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '获取博物馆列表' })
  findAll(@Query() query: QueryMuseumDto) {
    return this.museumsService.findAll(query);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: '获取附近博物馆' })
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('distance') distance?: number,
    @Query('limit') limit?: number,
  ) {
    return this.museumsService.findNearby(
      Number(lat),
      Number(lng),
      distance ? Number(distance) : 5000,
      limit ? Number(limit) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取博物馆详情' })
  @ApiBearerAuth()
  findOne(
    @Param('id', new ParseIntPipe()) id: number,
    @CurrentUser() user?: { userId: number },
  ) {
    return this.museumsService.findOne(id, user?.userId);
  }
}