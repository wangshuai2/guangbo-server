import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';
import { MedalCheckerService } from './medal-checker.service';

@Injectable()
export class MedalService {
  constructor(
    private prisma: PrismaService,
    private medalChecker: MedalCheckerService,
  ) {}

  /**
   * 获取所有勋章列表（含用户解锁状态）
   */
  async getAllMedals(userId?: number) {
    const medals = await this.prisma.medal.findMany({
      where: { status: 0 },
      orderBy: { sortOrder: 'asc' },
    });

    let unlockedIds: number[] = [];
    if (userId) {
      const userMedals = await this.prisma.userMedal.findMany({
        where: { userId },
        select: { medalId: true },
      });
      unlockedIds = userMedals.map((um) => um.medalId);
    }

    const result = await Promise.all(
      medals.map(async (medal) => {
        const unlocked = unlockedIds.includes(medal.id);
        let progress = null;

        if (userId && !unlocked) {
          const progressData = await this.medalChecker.getMedalProgress(userId, medal.id);
          progress = progressData?.progress || 0;
        }

        return {
          id: medal.id.toString(),
          code: medal.code,
          name: medal.name,
          description: medal.description,
          type: medal.type,
          icon: medal.icon,
          expReward: medal.expReward,
          rarity: medal.rarity,
          unlocked,
          progress,
        };
      }),
    );

    return { list: result };
  }

  /**
   * 获取勋章详情
   */
  async getMedalDetail(id: number, userId?: number) {
    const medal = await this.prisma.medal.findUnique({
      where: { id },
    });

    if (!medal) {
      return null;
    }

    let unlocked = false;
    let unlockedAt = null;
    let progress = null;

    if (userId) {
      const progressData = await this.medalChecker.getMedalProgress(userId, medal.id);
      unlocked = progressData?.unlocked || false;
      unlockedAt = progressData?.unlockedAt || null;
      progress = progressData?.progress || 0;
    }

    return {
      id: medal.id.toString(),
      code: medal.code,
      name: medal.name,
      description: medal.description,
      type: medal.type,
      conditionType: medal.conditionType,
      conditionValue: medal.conditionValue,
      icon: medal.icon,
      expReward: medal.expReward,
      rarity: medal.rarity,
      unlocked,
      unlockedAt,
      progress,
    };
  }

  /**
   * 获取用户已解锁的勋章
   */
  async getUserMedals(userId: number) {
    const userMedals = await this.prisma.userMedal.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
      include: {
        medal: true,
      },
    });

    return {
      list: userMedals.map((um) => ({
        id: um.medal.id.toString(),
        code: um.medal.code,
        name: um.medal.name,
        description: um.medal.description,
        icon: um.medal.icon,
        expReward: um.medal.expReward,
        rarity: um.medal.rarity,
        unlockedAt: um.unlockedAt,
      })),
    };
  }
}