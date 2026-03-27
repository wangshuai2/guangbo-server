import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsBoolean,
  IsObject,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';

// 勋章类型枚举
export enum MedalType {
  SHARE = 'share',
  LIKE = 'like',
  FOOTPRINT = 'footprint',
}

// 创建勋章 DTO
export class CreateMedalDto {
  @ApiProperty({ description: '勋章名称', example: '初露锋芒' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '勋章类型',
    enum: MedalType,
    example: MedalType.SHARE,
  })
  @IsEnum(MedalType)
  type: MedalType;

  @ApiProperty({ description: '等级', example: 1 })
  @IsInt()
  @Min(1)
  level: number;

  @ApiProperty({
    description: '解锁条件 (JSON)',
    example: { type: 'share_count', value: 10 },
  })
  @IsObject()
  unlockCondition: Record<string, any>;

  @ApiPropertyOptional({
    description: '勋章图标 URL',
    example: 'https://example.com/medal.png',
  })
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiPropertyOptional({ description: '勋章描述', example: '累计分享 10 次' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

// 更新勋章 DTO
export class UpdateMedalDto extends PartialType(CreateMedalDto) {}

// 切换勋章状态 DTO
export class ToggleMedalDto {
  @ApiProperty({ description: '是否启用', example: true })
  @IsBoolean()
  isActive: boolean;
}
