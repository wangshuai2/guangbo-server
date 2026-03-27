import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

// 管理员登录 DTO
export class AdminLoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  username: string;

  @ApiProperty({ description: '密码', example: 'admin123' })
  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  password: string;
}

// 创建管理员 DTO
export class CreateAdminDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  username: string;

  @ApiProperty({ description: '密码', example: 'admin123' })
  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  password: string;

  @ApiProperty({ description: '昵称', example: '管理员', required: false })
  @IsString()
  nickname?: string;

  @ApiProperty({
    description: '角色',
    example: 'admin',
    enum: ['admin', 'super_admin'],
  })
  @IsString()
  role?: string;
}
