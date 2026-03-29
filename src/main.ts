import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 获取配置
  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('app.apiPrefix') || '/api/v1';
  const port = configService.get<number>('app.port') || 3000;

  // 设置全局前缀，排除 admin 路由（admin 使用独立前缀 /api/admin）
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      'admin/auth/login',
      'admin/auth/init',
      'admin/auth/profile',
      'admin/users',
      'admin/users/:id',
      'admin/users/:id/ban',
      'admin/museums',
      'admin/museums/:id',
      'admin/museums/:id/toggle',
      'admin/stats/overview',
      'admin/stats/footprints',
      'admin/stats/hot-museums',
      'admin/stats/medals',
    ],
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 启用 CORS
  app.enableCors();

  // ==================== Swagger 配置 ====================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('逛博 APP API')
    .setDescription('全国博物馆聚合平台 API 文档')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', '认证相关接口')
    .addTag('medals', '勋章管理接口')
    .addTag('regions', '地区管理接口')
    .addTag('museums', '博物馆接口')
    .addTag('users', '用户接口')
    .addTag('footprints', '足迹接口')
    .addTag('shares', '分享接口')
    .addTag('admin', '管理后台接口')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);

  console.log(`🚀 逛博后端服务已启动: http://localhost:${port}${apiPrefix}`);
  console.log(`📚 API 文档: http://localhost:${port}/api/docs`);
}
bootstrap();
