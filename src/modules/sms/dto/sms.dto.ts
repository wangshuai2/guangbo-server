import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, Length } from 'class-validator';

// 发送验证码 DTO
export class SendSmsDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;
}

// 验证码登录 DTO
export class SmsLoginDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @ApiProperty({ description: '验证码', example: '123456' })
  @IsString()
  @Length(6, 6, { message: '验证码必须是6位' })
  code: string;
}

// 验证码校验 DTO
export class VerifySmsDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @ApiProperty({ description: '验证码', example: '123456' })
  @IsString()
  @Length(6, 6, { message: '验证码必须是6位' })
  code: string;
}