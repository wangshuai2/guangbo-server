import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SendSmsDto, SmsLoginDto, VerifySmsDto } from './dto/sms.dto';
import { AuthService } from '../auth/auth.service';

@ApiTags('auth')
@Controller('auth/sms')
export class SmsController {
  constructor(
    private readonly smsService: SmsService,
    private readonly authService: AuthService,
  ) {}

  @Post('send')
  @ApiOperation({ summary: '发送短信验证码' })
  @ApiResponse({ status: 201, description: '验证码发送成功' })
  @ApiResponse({ status: 429, description: '请求过于频繁' })
  async sendCode(@Body() dto: SendSmsDto) {
    return this.smsService.sendCode(dto.phone);
  }

  @Post('login')
  @ApiOperation({ summary: '验证码登录（新用户自动注册）' })
  @ApiResponse({ status: 201, description: '登录成功，返回 token' })
  @ApiResponse({ status: 400, description: '验证码错误或已过期' })
  async login(@Body() dto: SmsLoginDto) {
    // 验证验证码
    await this.smsService.verifyCode(dto.phone, dto.code);

    // 登录或注册
    const result = await this.authService.loginOrRegisterByPhone(dto.phone);

    return result;
  }

  @Post('verify')
  @ApiOperation({ summary: '验证码校验' })
  @ApiResponse({ status: 201, description: '验证成功' })
  @ApiResponse({ status: 400, description: '验证码错误或已过期' })
  async verify(@Body() dto: VerifySmsDto) {
    await this.smsService.verifyCode(dto.phone, dto.code);
    return { success: true, message: '验证成功' };
  }
}