/**
 * 阿里云 OSS 配置和接口定义
 */

/**
 * OSS 配置选项
 */
export interface OssConfig {
  /** 阿里云 AccessKey ID */
  accessKeyId: string;
  /** 阿里云 AccessKey Secret */
  accessKeySecret: string;
  /** OSS 地域，如 oss-cn-beijing */
  region: string;
  /** 存储桶名称 */
  bucket: string;
  /** 自定义域名（可选） */
  endpoint?: string;
  /** 上传文件大小限制（字节），默认 10MB */
  maxSize?: number;
  /** 允许的文件类型 */
  allowedMimeTypes?: string[];
}

/**
 * 上传结果
 */
export interface UploadResult {
  /** 文件访问 URL */
  url: string;
  /** 文件名 */
  filename: string;
  /** OSS 对象 key */
  key: string;
  /** 文件大小 */
  size: number;
  /** MIME 类型 */
  mimeType: string;
}

/**
 * 上传选项
 */
export interface UploadOptions {
  /** 自定义文件名前缀 */
  prefix?: string;
  /** 自定义文件名 */
  filename?: string;
  /** 是否公开读 */
  public?: boolean;
}

/**
 * STS 临时凭证
 */
export interface StsCredential {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;
  region: string;
  bucket: string;
}
