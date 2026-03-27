import { registerAs } from '@nestjs/config';

/**
 * OSS 配置
 */
export default registerAs('oss', () => ({
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
  region: process.env.OSS_REGION || 'oss-cn-beijing',
  bucket: process.env.OSS_BUCKET || '',
  endpoint: process.env.OSS_ENDPOINT || '',
  maxSize: parseInt(process.env.OSS_MAX_SIZE || '10485760', 10), // 默认 10MB
}));