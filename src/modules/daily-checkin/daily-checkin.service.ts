import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';

// 签到奖励配置
const BASE_EXP = 5; // 基础经验值
const STREAK_BONUS: Record<number, number> = {
  3: 2,   // 连续3天额外+2
  7: 5,   // 连续7天额外+5
  14: 10, // 连续14天额外+10
  30: 30, // 连续30天额外+30
};

@Injectable()
export class DailyCheckinService {
  constructor(private prisma: PrismaService) {}

  /**
   * 每日签到
   */
  async checkin(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. 检查今天是否已签到
    const existingCheckin = await this.prisma.dailyCheckin.findUnique({
      where: {
        userId_checkinDate: {
          userId,
          checkinDate: today,
        },
      },
    });

    if (existingCheckin) {
      return {
        success: false,
        message: '今天已经签到过了',
        data: {
          checkinDate: existingCheckin.checkinDate,
          streak: existingCheckin.streak,
          reward: existingCheckin.reward,
        },
      };
    }

    // 2. 计算连续签到天数
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayCheckin = await this.prisma.dailyCheckin.findUnique({
      where: {
        userId_checkinDate: {
          userId,
          checkinDate: yesterday,
        },
      },
    });

    const streak = yesterdayCheckin ? yesterdayCheckin.streak + 1 : 1;

    // 3. 计算奖励经验值
    const bonusExp = this.calculateStreakBonus(streak);
    const totalExp = BASE_EXP + bonusExp;

    // 4. 创建签到记录
    const checkin = await this.prisma.dailyCheckin.create({
      data: {
        userId,
        checkinDate: today,
        streak,
        reward: totalExp,
      },
    });

    // 5. 更新用户经验值
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        exp: { increment: totalExp },
      },
    });

    return {
      success: true,
      message: `签到成功！连续签到 ${streak} 天，获得 ${totalExp} 经验值`,
      data: {
        checkinDate: checkin.checkinDate,
        streak,
        reward: totalExp,
        baseExp: BASE_EXP,
        bonusExp,
      },
    };
  }

  /**
   * 获取签到状态
   */
  async getCheckinStatus(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCheckin = await this.prisma.dailyCheckin.findUnique({
      where: {
        userId_checkinDate: {
          userId,
          checkinDate: today,
        },
      },
    });

    // 获取最近一次签到记录
    const lastCheckin = await this.prisma.dailyCheckin.findFirst({
      where: { userId },
      orderBy: { checkinDate: 'desc' },
    });

    // 计算当前连续天数
    let currentStreak = 0;
    if (todayCheckin) {
      currentStreak = todayCheckin.streak;
    } else if (lastCheckin) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastCheckin.checkinDate.getTime() === yesterday.getTime()) {
        currentStreak = lastCheckin.streak;
      }
    }

    return {
      todayCheckedIn: !!todayCheckin,
      currentStreak,
      lastCheckinDate: lastCheckin?.checkinDate || null,
    };
  }

  /**
   * 获取签到日历（某月）
   */
  async getCheckinCalendar(userId: number, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const checkins = await this.prisma.dailyCheckin.findMany({
      where: {
        userId,
        checkinDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        checkinDate: true,
        streak: true,
        reward: true,
      },
      orderBy: { checkinDate: 'asc' },
    });

    // 构建日历数据
    const calendar: Record<string, { streak: number; reward: number }> = {};
    checkins.forEach((c) => {
      const day = c.checkinDate.getDate();
      calendar[day] = {
        streak: c.streak,
        reward: c.reward,
      };
    });

    return {
      year,
      month,
      totalDays: checkins.length,
      calendar,
    };
  }

  /**
   * 获取签到历史记录
   */
  async getCheckinHistory(userId: number, page: number = 1, pageSize: number = 30) {
    const skip = (page - 1) * pageSize;

    const checkins = await this.prisma.dailyCheckin.findMany({
      where: { userId },
      select: {
        id: true,
        checkinDate: true,
        streak: true,
        reward: true,
        createdAt: true,
      },
      orderBy: { checkinDate: 'desc' },
      skip,
      take: pageSize,
    });

    const total = await this.prisma.dailyCheckin.count({
      where: { userId },
    });

    return {
      list: checkins.map((c) => ({
        id: c.id,
        date: c.checkinDate.toISOString().split('T')[0],
        streak: c.streak,
        reward: c.reward,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 计算连续签到奖励
   */
  private calculateStreakBonus(streak: number): number {
    let bonus = 0;
    
    // 按里程碑倒序检查
    const milestones = Object.keys(STREAK_BONUS)
      .map(Number)
      .sort((a, b) => b - a);
    
    for (const milestone of milestones) {
      if (streak >= milestone) {
        bonus = STREAK_BONUS[milestone];
        break;
      }
    }
    
    return bonus;
  }
}