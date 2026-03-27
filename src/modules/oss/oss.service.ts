import { Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS = require('ali-oss');
import { UploadResult, UploadOptions, OssConfig } from './oss.interface';

/**
 * 阿里云 OSS 服务
 */
@Injectable()
export class OssService implements OnModuleInit {
  private readonly logger = new Logger(OssService.name);
  private client: OSS;
  private config: OssConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      accessKeyId: this.configService.get<string>('OSS_ACCESS_KEY_ID') || '',
      accessKeySecret: this.configService.get<string>('OSS_ACCESS_KEY_SECRET') || '',
      region: this.configService.get<string>('OSS_REGION') || 'oss-cn-beijing',
      bucket: this.configService.get<string>('OSS_BUCKET') || '',
      endpoint: this.configService.get<string>('OSS_ENDPOINT'),
      maxSize: 10 * 1024 * 1024, // 默认 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ],
    };
  }

  async onModuleInit() {
    try {
      // 创建 OSS 客户端 - 使用阿里云标准域名进行 API 操作
      this.client = new OSS({
        region: this.config.region,
        bucket: this.config.bucket,
        accessKeyId: this.config.accessKeyId,
        accessKeySecret: this.config.accessKeySecret,
        secure: true, // 使用 HTTPS
      });

      this.logger.log('阿里云 OSS 客户端初始化成功');
      this.logger.log(`Bucket: ${this.config.bucket}, Region: ${this.config.region}`);
      if (this.config.endpoint) {
        this.logger.log(`CDN 域名: ${this.config.endpoint}`);
      }
    } catch (error) {
      this.logger.error('阿里云 OSS 客户端初始化失败', error);
      throw error;
    }
  }

  /**
   * 上传文件
   * @param file 文件对象（Express.Multer.File）
   * @param options 上传选项
   */
  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    // 验证文件
    this.validateFile(file);

    // 生成文件名
    const key = this.generateKey(file, options.prefix, options.filename);

    try {
      // 上传到 OSS
      const result = await this.client.put(key, file.buffer, {
        headers: {
          'Content-Type': file.mimetype,
        },
      });

      this.logger.log(`文件上传成功: ${key}`);

      // 获取访问 URL
      const url = this.getUrl(key);

      return {
        url,
        filename: file.originalname,
        key,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`文件上传失败: ${error.message}`, error.stack);
      throw new BadRequestException('文件上传失败，请稍后重试');
    }
  }

  /**
   * 批量上传文件
   * @param files 文件数组
   * @param options 上传选项
   */
  async uploadFiles(
    files: Express.Multer.File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file, options);
      results.push(result);
    }

    return results;
  }

  /**
   * 删除文件
   * @param key 文件 key
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.delete(key);
      this.logger.log(`文件删除成功: ${key}`);
    } catch (error) {
      this.logger.error(`文件删除失败: ${error.message}`, error.stack);
      throw new BadRequestException('文件删除失败');
    }
  }

  /**
   * 批量删除文件
   * @param keys 文件 key 数组
   */
  async deleteFiles(keys: string[]): Promise<void> {
    try {
      await this.client.deleteMulti(keys);
      this.logger.log(`批量删除文件成功: ${keys.length} 个`);
    } catch (error) {
      this.logger.error(`批量删除文件失败: ${error.message}`, error.stack);
      throw new BadRequestException('批量删除文件失败');
    }
  }

  /**
   * 获取文件访问 URL
   * @param key 文件 key
   * @param expires 过期时间（秒），默认 1 小时
   */
  async getFileUrl(key: string, expires: number = 3600): Promise<string> {
    try {
      const url = this.client.signatureUrl(key, { expires });
      return url;
    } catch (error) {
      this.logger.error(`获取文件 URL 失败: ${error.message}`);
      throw new BadRequestException('获取文件 URL 失败');
    }
  }

  /**
   * 检查文件是否存在
   * @param key 文件 key
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.client.head(key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证文件
   */
  private validateFile(file: Express.Multer.File): void {
    // 检查文件大小
    if (file.size > this.config.maxSize!) {
      throw new BadRequestException(
        `文件大小超过限制（最大 ${Math.round(this.config.maxSize! / 1024 / 1024)}MB）`
      );
    }

    // 检查文件类型
    if (this.config.allowedMimeTypes && this.config.allowedMimeTypes.length > 0) {
      if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `不支持的文件类型：${file.mimetype}，仅支持：${this.config.allowedMimeTypes.join(', ')}`
        );
      }
    }
  }

  /**
   * 生成文件存储 key
   */
  private generateKey(
    file: Express.Multer.File,
    prefix?: string,
    customFilename?: string
  ): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // 文件后缀
    const ext = this.getExtension(file.originalname);

    // 生成文件名
    const filename = customFilename || `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 组装 key：prefix/YYYY/MM/DD/filename.ext
    const keyParts = [prefix || 'uploads', year.toString(), month, day, `${filename}${ext}`];
    
    return keyParts.filter(Boolean).join('/');
  }

  /**
   * 获取文件扩展名
   */
  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  /**
   * 获取文件访问 URL
   */
  private getUrl(key: string): string {
    // 使用自定义域名
    if (this.config.endpoint) {
      // 移除 https:// 前缀，如果有的话
      const endpoint = this.config.endpoint.replace(/^https?:\/\//, '');
      return `https://${endpoint}/${key}`;
    }
    // 使用默认域名
    return `https://${this.config.bucket}.${this.config.region}.aliyuncs.com/${key}`;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      if (!this.config.accessKeyId || !this.config.accessKeySecret) {
        return {
          healthy: false,
          message: 'OSS 配置不完整，缺少 AccessKey',
        };
      }

      if (!this.config.bucket) {
        return {
          healthy: false,
          message: 'OSS 配置不完整，缺少 Bucket 名称',
        };
      }

      if (!this.client) {
        return {
          healthy: false,
          message: 'OSS 客户端未初始化',
        };
      }

      // 尝试获取 bucket 信息
      await this.client.getBucketInfo(this.config.bucket);

      return {
        healthy: true,
        message: 'OSS 服务运行正常',
      };
    } catch (error) {
      return {
        healthy: false,
        message: `OSS 服务异常: ${error.message}`,
      };
    }
  }
}