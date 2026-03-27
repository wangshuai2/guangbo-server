import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/utils/prisma.service';
import { AdminLoginDto, CreateAdminDto } from './dto/admin.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 管理员登录
  async login(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const token = this.generateToken(admin.id, admin.role);

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        role: admin.role,
      },
      token,
    };
  }

  // 创建管理员（仅超级管理员）
  async createAdmin(dto: CreateAdminDto) {
    const existing = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const admin = await this.prisma.admin.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        nickname: dto.nickname,
        role: dto.role || 'admin',
      },
    });

    return {
      id: admin.id,
      username: admin.username,
      nickname: admin.nickname,
      role: admin.role,
    };
  }

  // 获取管理员信息
  async getProfile(adminId: number) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    return {
      id: admin.id,
      username: admin.username,
      nickname: admin.nickname,
      role: admin.role,
    };
  }

  // 初始化超级管理员
  async initSuperAdmin() {
    const existing = await this.prisma.admin.findFirst({
      where: { role: 'super_admin' },
    });

    if (existing) {
      return { message: '超级管理员已存在', username: existing.username };
    }

    const hashedPassword = await bcrypt.hash('admin123456', 10);
    const admin = await this.prisma.admin.create({
      data: {
        username: 'superadmin',
        password: hashedPassword,
        nickname: '超级管理员',
        role: 'super_admin',
      },
    });

    return {
      message: '超级管理员创建成功',
      username: admin.username,
      password: 'admin123456',
    };
  }

  private generateToken(adminId: number, role: string) {
    const payload = { sub: adminId, role, type: 'admin' };
    return this.jwtService.sign(payload);
  }
}