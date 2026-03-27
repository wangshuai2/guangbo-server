import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  // 内存缓存（Redis 不可用时的降级方案）
  private memoryCache: Map<string, { value: string; expireAt: number }> =
    new Map();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('redis.host') || 'localhost';
    const port = this.configService.get<number>('redis.port') || 6379;
    const password =
      this.configService.get<string>('redis.password') || undefined;

    try {
      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis 连接失败，使用内存缓存降级');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true, // 延迟连接
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`Redis 连接成功: ${host}:${port}`);
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis 错误: ${err.message}`);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis 连接关闭');
      });

      // 尝试连接
      await this.client.connect().catch(() => {
        this.logger.warn('Redis 连接失败，使用内存缓存降级');
        this.isConnected = false;
      });
    } catch (error) {
      this.logger.warn('Redis 初始化失败，使用内存缓存降级');
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  /**
   * 设置键值（带过期时间）
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } else {
      // 降级到内存缓存
      this.memoryCache.set(key, {
        value,
        expireAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity,
      });
    }
  }

  /**
   * 获取键值
   */
  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      return this.client.get(key);
    } else {
      // 从内存缓存读取
      const item = this.memoryCache.get(key);
      if (!item) return null;

      // 检查是否过期
      if (Date.now() > item.expireAt) {
        this.memoryCache.delete(key);
        return null;
      }

      return item.value;
    }
  }

  /**
   * 删除键
   */
  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      await this.client.del(key);
    } else {
      this.memoryCache.delete(key);
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (this.isConnected && this.client) {
      const result = await this.client.exists(key);
      return result === 1;
    } else {
      const item = this.memoryCache.get(key);
      if (!item) return false;

      // 检查是否过期
      if (Date.now() > item.expireAt) {
        this.memoryCache.delete(key);
        return false;
      }

      return true;
    }
  }

  /**
   * 获取键的剩余过期时间（秒）
   */
  async ttl(key: string): Promise<number> {
    if (this.isConnected && this.client) {
      return this.client.ttl(key);
    } else {
      const item = this.memoryCache.get(key);
      if (!item || item.expireAt === Infinity) return -1;

      const remaining = Math.floor((item.expireAt - Date.now()) / 1000);
      return Math.max(0, remaining);
    }
  }

  /**
   * 递增计数器
   */
  async incr(key: string): Promise<number> {
    if (this.isConnected && this.client) {
      return this.client.incr(key);
    } else {
      const item = this.memoryCache.get(key);
      const newValue = item ? parseInt(item.value) + 1 : 1;
      this.memoryCache.set(key, {
        value: String(newValue),
        expireAt: item?.expireAt || Infinity,
      });
      return newValue;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    if (this.isConnected && this.client) {
      try {
        const result = await this.client.ping();
        return {
          healthy: result === 'PONG',
          message: result === 'PONG' ? 'Redis 服务正常' : 'Redis 服务异常',
        };
      } catch (error) {
        return {
          healthy: false,
          message: `Redis 服务异常: ${error.message}`,
        };
      }
    } else {
      return {
        healthy: true,
        message: '使用内存缓存降级模式',
      };
    }
  }
}
