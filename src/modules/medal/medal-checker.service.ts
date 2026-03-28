import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';

@Injectable()
export class MedalCheckerService {
  private readonly logger = new Logger(MedalCheckerService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 检查并解锁勋章
   */
  async checkAndUnlockMedals(userId: number) {
    // 获取用户信息
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { checkinCount: true, provinceCount: true },
    });

    if (!user) return [];

    // 获取所有可解锁的勋章
    const medals = await this.prisma.medal.findMany({
      where: { type: 'checkin', status: 0 },
    });

    // 获取用户已解锁的勋章
    const unlockedMedalIds = (
      await this.prisma.userMedal.findMany({
        where: { userId },
        select: { medalId: true },
      })
    ).map((um) => um.medalId);

    const newlyUnlocked: { id: number; name: string; expReward: number }[] = [];

    for (const medal of medals) {
      // 跳过已解锁的
      if (unlockedMedalIds.includes(medal.id)) continue;

      // 检查条件
      let shouldUnlock = false;

      switch (medal.conditionType) {
        case 'checkin_count':
          shouldUnlock = user.checkinCount >= (medal.conditionValue || 0);
          break;

        case 'province_count':
          shouldUnlock = user.provinceCount >= (medal.conditionValue || 0);
          break;

        default:
          this.logger.warn(`未知的勋章条件类型: ${medal.conditionType}`);
      }

      if (shouldUnlock) {
        // 解锁勋章
        await this.prisma.userMedal.create({
          data: {
            userId,
            medalId: medal.id,
            unlockedAt: new Date(),
          },
        });

        // 更新用户勋章数
        await this.prisma.user.update({
          where: { id: userId },
          data: { medalCount: { increment: 1 } },
        });

        newlyUnlocked.push({
          id: medal.id,
          name: medal.name,
          expReward: medal.expReward,
        });

        this.logger.log(`用户 ${userId} 解锁勋章: ${medal.name}`);
      }
    }

    return newlyUnlocked;
  }

  /**
   * 获取用户勋章进度
   */
  async getMedalProgress(userId: number, medalId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { checkinCount: true, provinceCount: true },
    });

    const medal = await this.prisma.medal.findUnique({
      where: { id: medalId },
    });

    if (!user || !medal) return null;

    const userMedal = await this.prisma.userMedal.findUnique({
      where: { userId_medalId: { userId, medalId } },
    });

    let current = 0;
    const target = medal.conditionValue || 0;

    switch (medal.conditionType) {
      case 'checkin_count':
        current = user.checkinCount;
        break;
      case 'province_count':
        current = user.provinceCount;
        break;
    }

    return {
      current,
      target,
      progress: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
      unlocked: !!userMedal,
      unlockedAt: userMedal?.unlockedAt,
    };
  }
}