import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

class UserInfoDto {
  @ApiProperty({ description: '用户昵称', required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ description: '用户头像', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class WechatLoginDto {
  @ApiProperty({ description: '微信登录 code' })
  @IsString()
  @IsNotEmpty({ message: '微信登录 code 不能为空' })
  code: string;

  @ApiProperty({ description: '用户信息', required: false, type: UserInfoDto })
  @IsOptional()
  userInfo?: UserInfoDto;
}