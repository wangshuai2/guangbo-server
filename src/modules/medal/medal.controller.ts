import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MedalService } from './medal.service';

@ApiTags('勋章')
@Controller('v1/medals')
export class MedalController {
  constructor(private readonly medalService: MedalService) {}

  @Get()
  @ApiOperation({ summary: '获取勋章列表', description: '获取所有勋章（含解锁状态）' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getAllMedals(@Request() req: any) {
    return this.medalService.getAllMedals(Number(req.user.id));
  }

  @Get('my')
  @ApiOperation({ summary: '获取我的勋章', description: '获取用户已解锁的勋章' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMyMedals(@Request() req: any) {
    return this.medalService.getUserMedals(Number(req.user.id));
  }

  @Get(':id')
  @ApiOperation({ summary: '获取勋章详情', description: '获取单个勋章详情' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMedalDetail(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.medalService.getMedalDetail(id, Number(req.user.id));
  }
}