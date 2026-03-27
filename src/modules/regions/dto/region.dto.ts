import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, IsOptional, IsEnum, Min } from 'class-validator';

// 地区类型枚举
export enum RegionType {
  PROVINCE = 'province',
  CITY = 'city',
  DISTRICT = 'district',
}

// 创建地区 DTO
export class CreateRegionDto {
  @ApiProperty({ description: '地区名称', example: '北京市' })
  @IsString()
  name: string;

  @ApiProperty({ description: '地区类型', enum: RegionType, example: RegionType.PROVINCE })
  @IsEnum(RegionType)
  type: RegionType;

  @ApiPropertyOptional({ description: '上级地区 ID', example: 1 })
  @IsOptional()
  @IsInt()
  parentId?: number;

  @ApiPropertyOptional({ description: '行政区划代码', example: '110000' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

// 更新地区 DTO
export class UpdateRegionDto extends PartialType(CreateRegionDto) {}

// 切换地区状态 DTO
export class ToggleRegionDto {
  @ApiProperty({ description: '是否启用', example: true })
  @IsBoolean()
  isActive: boolean;
}

// 地区树节点 DTO（响应用）
export class RegionTreeDto {
  @ApiProperty({ description: '地区 ID' })
  id: number;

  @ApiProperty({ description: '地区名称' })
  name: string;

  @ApiProperty({ description: '地区类型', enum: RegionType })
  type: RegionType;

  @ApiPropertyOptional({ description: '行政区划代码' })
  code?: string;

  @ApiProperty({ description: '是否启用' })
  isActive: boolean;

  @ApiPropertyOptional({ description: '子地区' })
  children?: RegionTreeDto[];
}