import { Injectable, Logger, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  
  // 验证码配置
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRE_SECONDS = 300; // 5 分钟
  private readonly RATE_LIMIT_SECONDS = 60; // 60 秒限流

  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  /**
   * 发送验证码
   * @param phone 手机号
   * @returns 验证码（开发环境返回，生产环境不返回）
   */
  async sendCode(phone: string): Promise<{ success: boolean; code?: string }> {
    // 检查限流
    const rateLimitKey = `sms:limit:${phone}`;
    const isLimited = await this.redisService.exists(rateLimitKey);
    
    if (isLimited) {
      const ttl = await this.redisService.ttl(rateLimitKey);
      throw new HttpException(`请求过于频繁，请 ${ttl} 秒后重试`, HttpStatus.TOO_MANY_REQUESTS);
    }

    // 生成验证码
    const code = this.generateCode();

    // 存储验证码（5 分钟过期）
    const codeKey = `sms:code:${phone}`;
    await this.redisService.set(codeKey, code, this.CODE_EXPIRE_SECONDS);

    // 设置限流标记（60 秒过期）
    await this.redisService.set(rateLimitKey, '1', this.RATE_LIMIT_SECONDS);

    // 发送短信（生产环境调用短信服务）
    await this.sendSmsToProvider(phone, code);

    this.logger.log(`验证码已发送: ${phone} -> ${code}`);

    // 开发环境返回验证码，方便测试
    const nodeEnv = this.configService.get<string>('app.nodeEnv');
    if (nodeEnv === 'development') {
      return { success: true, code };
    }

    return { success: true };
  }

  /**
   * 验证验证码
   * @param phone 手机号
   * @param code 验证码
   * @returns 是否验证成功
   */
  async verifyCode(phone: string, code: string): Promise<boolean> {
    const codeKey = `sms:code:${phone}`;
    const storedCode = await this.redisService.get(codeKey);

    if (!storedCode) {
      throw new BadRequestException('验证码已过期或不存在');
    }

    if (storedCode !== code) {
      throw new BadRequestException('验证码错误');
    }

    // 验证成功后删除验证码
    await this.redisService.del(codeKey);

    return true;
  }

  /**
   * 生成随机验证码
   */
  private generateCode(): string {
    let code = '';
    for (let i = 0; i < this.CODE_LENGTH; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  /**
   * 调用短信服务商发送短信
   * TODO: 接入真实的短信服务商（阿里云、腾讯云等）
   */
  private async sendSmsToProvider(phone: string, code: string): Promise<void> {
    // 开发环境只打印日志
    const nodeEnv = this.configService.get<string>('app.nodeEnv');
    if (nodeEnv === 'development') {
      this.logger.log(`[开发模式] 短信发送: ${phone} -> ${code}`);
      return;
    }

    // 生产环境调用短信服务商 API
    // 这里可以接入阿里云短信、腾讯云短信等服务
    // 示例：阿里云短信
    try {
      // TODO: 接入真实短信服务
      // const result = await this.aliyunSmsService.send(phone, code);
      this.logger.log(`短信发送成功: ${phone}`);
    } catch (error) {
      this.logger.error(`短信发送失败: ${phone}`, error);
      throw new BadRequestException('短信发送失败，请稍后重试');
    }
  }
}