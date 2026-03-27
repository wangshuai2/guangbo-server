import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';

@Injectable()
export class UserManageService {
  constructor(private prisma: PrismaService) {}

  // 用户列表（分页）
  async findAll(page: number = 1, pageSize: number = 10, keyword?: string) {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (keyword) {
      where.OR = [
        { phone: { contains: keyword } },
        { nickname: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          nickname: true,
          avatar: true,
          createdAt: true,
          _count: {
            select: {
              footprints: true,
              shares: true,
              collections: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 用户详情
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        stats: true,
        _count: {
          select: {
            footprints: true,
            shares: true,
            collections: true,
            userMedals: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { password, ...result } = user;
    return result;
  }

  // 更新用户
  async update(id: number, data: any) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        nickname: data.nickname,
        avatar: data.avatar,
      },
    });
  }

  // 封禁用户（设置空密码使其无法登录）
  async ban(id: number) {
    await this.findOne(id);

    // 简单实现：重置密码为随机值
    const randomPassword = Math.random().toString(36).substring(2, 15);
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  // 获取用户统计数据
  async getUserStats(id: number) {
    const user = await this.findOne(id);

    return {
      footprintCount: user._count?.footprints || 0,
      shareCount: user._count?.shares || 0,
      collectionCount: user._count?.collections || 0,
      medalCount: user._count?.userMedals || 0,
    };
  }
}
