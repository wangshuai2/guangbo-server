import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MuseumService } from './museum.service';
import { UserManageService } from './user-manage.service';
import { StatsService } from './stats.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret =
          configService.get<string>('jwt.secret') || 'default_secret';
        const expiresIn = (configService.get<string>('jwt.expiresIn') ||
          '7d') as '7d';
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, MuseumService, UserManageService, StatsService],
  exports: [AdminService],
})
export class AdminModule {}
