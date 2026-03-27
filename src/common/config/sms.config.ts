import { registerAs } from '@nestjs/config';

export default registerAs('sms', () => ({
  // 阿里云短信配置
  accessKeyId: process.env.SMS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || '',
  // 短信签名
  signName: process.env.SMS_SIGN_NAME || '速通互联验证码',
  // 验证码短信模板CODE
  templateCode: process.env.SMS_TEMPLATE_CODE || '100001',
}));
