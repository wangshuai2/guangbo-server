import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';
import { CreateMedalDto, UpdateMedalDto } from './dto/medal.dto';

@Injectable()
export class MedalsService {
  constructor(private prisma: PrismaService) {}

  // 获取勋章列表
  async findAll(isActive?: boolean) {
    const where = isActive !== undefined ? { isActive } : {};

    return this.prisma.medal.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { level: 'asc' }],
    });
  }

  // 获取单个勋章
  async findOne(id: number) {
    const medal = await this.prisma.medal.findUnique({
      where: { id },
    });

    if (!medal) {
      throw new NotFoundException(`勋章 #${id} 不存在`);
    }

    return medal;
  }

  // 创建勋章
  async create(createMedalDto: CreateMedalDto) {
    // 检查是否已存在相同类型和等级的勋章
    const existing = await this.prisma.medal.findFirst({
      where: {
        type: createMedalDto.type,
        level: createMedalDto.level,
      },
    });

    if (existing) {
      throw new ConflictException(
        `勋章类型 ${createMedalDto.type} 等级 ${createMedalDto.level} 已存在`,
      );
    }

    return this.prisma.medal.create({
      data: {
        ...createMedalDto,
        unlockCondition: JSON.stringify(createMedalDto.unlockCondition),
      },
    });
  }

  // 更新勋章
  async update(id: number, updateMedalDto: UpdateMedalDto) {
    await this.findOne(id); // 检查是否存在

    // 如果更新了类型或等级，检查是否冲突
    if (updateMedalDto.type || updateMedalDto.level) {
      const existing = await this.prisma.medal.findFirst({
        where: {
          type: updateMedalDto.type,
          level: updateMedalDto.level,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `勋章类型 ${updateMedalDto.type} 等级 ${updateMedalDto.level} 已存在`,
        );
      }
    }

    return this.prisma.medal.update({
      where: { id },
      data: updateMedalDto,
    });
  }

  // 删除勋章
  async remove(id: number) {
    await this.findOne(id); // 检查是否存在

    return this.prisma.medal.delete({
      where: { id },
    });
  }

  // 切换勋章状态
  async toggle(id: number, isActive: boolean) {
    await this.findOne(id); // 检查是否存在

    return this.prisma.medal.update({
      where: { id },
      data: { isActive },
    });
  }

  // 获取用户已解锁的勋章
  async getUserMedals(userId: number) {
    return this.prisma.userMedal.findMany({
      where: { userId },
      include: { medal: true },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  // 检查用户是否可以解锁新勋章
  async checkAndUnlockMedals(userId: number) {
    // 获取用户统计
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) return [];

    // 获取所有启用的勋章
    const activeMedals = await this.prisma.medal.findMany({
      where: { isActive: true },
    });

    // 获取用户已解锁的勋章
    const unlockedMedalIds = (
      await this.prisma.userMedal.findMany({
        where: { userId },
        select: { medalId: true },
      })
    ).map((m) => m.medalId);

    // 检查每个勋章是否满足条件
    const newUnlocks = [];
    for (const medal of activeMedals) {
      if (unlockedMedalIds.includes(medal.id)) continue;

      const condition = medal.unlockCondition as any;
      const met = this.checkCondition(stats, condition);

      if (met) {
        await this.prisma.userMedal.create({
          data: { userId, medalId: medal.id },
        });
        newUnlocks.push(medal);
      }
    }

    return newUnlocks;
  }

  // 检查条件是否满足
  private checkCondition(stats: any, condition: any): boolean {
    const { type, value } = condition;

    switch (type) {
      case 'share_count':
        return stats.shareCount >= value;
      case 'like_count':
        return stats.likeCount >= value;
      case 'footprint_count':
        return stats.footprintCount >= value;
      case 'province_count':
        return stats.provinceCount >= value;
      case 'city_count':
        return stats.cityCount >= value;
      default:
        return false;
    }
  }
}
