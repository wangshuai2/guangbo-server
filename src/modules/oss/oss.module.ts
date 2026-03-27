import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OssService } from './oss.service';
import { OssController } from './oss.controller';

/**
 * OSS 文件上传模块
 */
@Global()
@Module({
  imports: [ConfigModule],
  controllers: [OssController],
  providers: [OssService],
  exports: [OssService],
})
export class OssModule {}