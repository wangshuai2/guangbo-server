import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCheckinDto {
  @ApiProperty({ description: '博物馆ID', example: '1' })
  @IsNotEmpty({ message: '博物馆ID不能为空' })
  @IsString()
  museumId: string;

  @ApiProperty({ description: '用户纬度', example: 39.9163 })
  @IsNotEmpty({ message: '纬度不能为空' })
  @IsNumber()
  @Min(-90, { message: '纬度范围为 -90 到 90' })
  @Max(90, { message: '纬度范围为 -90 到 90' })
  latitude: number;

  @ApiProperty({ description: '用户经度', example: 116.3972 })
  @IsNotEmpty({ message: '经度不能为空' })
  @IsNumber()
  @Min(-180, { message: '经度范围为 -180 到 180' })
  @Max(180, { message: '经度范围为 -180 到 180' })
  longitude: number;

  @ApiProperty({ description: '定位精度（米）', required: false, example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;
}

export class CheckinResponseDto {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '获得经验值', required: false })
  exp?: number;

  @ApiProperty({ description: '提示信息' })
  message: string;

  @ApiProperty({ description: '解锁勋章', required: false })
  unlockedMedals?: { id: string; name: string; expReward: number }[];

  @ApiProperty({ description: '是否升级', required: false })
  levelUp?: boolean;

  @ApiProperty({ description: '新等级', required: false })
  newLevel?: number;
}

export class CheckinQueryDto {
  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ description: '每页数量', default: 20, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}