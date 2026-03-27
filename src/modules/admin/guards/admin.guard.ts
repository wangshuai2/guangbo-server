import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('未提供认证信息');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = this.jwtService.verify(token);

      // 验证是否是管理员 token
      if (payload.type !== 'admin') {
        throw new UnauthorizedException('非管理员账户');
      }

      request.admin = {
        id: payload.sub,
        role: payload.role,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('认证信息无效');
    }
  }
}
