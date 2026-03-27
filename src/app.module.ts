import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './common/config/app.config';
import databaseConfig from './common/config/database.config';
import jwtConfig from './common/config/jwt.config';
import redisConfig from './common/config/redis.config';
import ossConfig from './common/config/oss.config';
import smsConfig from './common/config/sms.config';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { MedalsModule } from './modules/medals/medals.module';
import { RegionsModule } from './modules/regions/regions.module';
import { OssModule } from './modules/oss/oss.module';
import { SmsModule } from './modules/sms/sms.module';
import { AdminModule } from './modules/admin/admin.module';
import { PosterModule } from './modules/poster/poster.module';
import { SharesModule } from './modules/shares/shares.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        ossConfig,
        smsConfig,
      ],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    MedalsModule,
    RegionsModule,
    OssModule,
    SmsModule,
    AdminModule,
    PosterModule,
    SharesModule,
  ],
})
export class AppModule {}
