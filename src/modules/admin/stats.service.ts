import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  // 概览数据
  async getOverview() {
    const [userCount, museumCount, footprintCount, shareCount, medalCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.museum.count(),
      this.prisma.footprint.count(),
      this.prisma.share.count(),
      this.prisma.medal.count(),
    ]);

    // 今日新增用户
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUserCount = await this.prisma.user.count({
      where: { createdAt: { gte: today } },
    });

    // 今日打卡数
    const todayFootprintCount = await this.prisma.footprint.count({
      where: { createdAt: { gte: today } },
    });

    return {
      userCount,
      museumCount,
      footprintCount,
      shareCount,
      medalCount,
      todayUserCount,
      todayFootprintCount,
    };
  }

  // 打卡统计
  async getFootprintStats(days: number = 7) {
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.prisma.footprint.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      result.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    return result;
  }

  // 勋章统计
  async getMedalStats() {
    const medals = await this.prisma.medal.findMany({
      include: {
        _count: {
          select: { userMedals: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return medals.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      level: m.level,
      unlockCount: m._count.userMedals,
    }));
  }

  // 热门博物馆
  async getHotMuseums(limit: number = 10) {
    const museums = await this.prisma.museum.findMany({
      take: limit,
      include: {
        _count: {
          select: { footprints: true },
        },
      },
      orderBy: {
        footprints: {
          _count: 'desc',
        },
      },
    });

    return museums.map((m) => ({
      id: m.id,
      name: m.name,
      address: m.address,
      footprintCount: m._count.footprints,
    }));
  }
}