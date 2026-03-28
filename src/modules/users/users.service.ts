import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getUserProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        phone: true,
        createdAt: true,
      },
    });

    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    return {
      ...user,
      stats: {
        footprintCount: stats?.footprintCount || 0,
        provinceCount: stats?.provinceCount || 0,
        cityCount: stats?.cityCount || 0,
        shareCount: stats?.shareCount || 0,
        likeCount: stats?.likeCount || 0,
      },
    };
  }

  /**
   * 获取用户等级信息
   */
  async getUserLevelInfo(userId: number) {
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
      select: {
        footprintCount: true,
      },
    });

    const footprintCount = stats?.footprintCount || 0;
    const level = this.calculateLevel(footprintCount);
    const title = this.calculateTitle(footprintCount);
    const nextLevel = this.getNextLevelRequirement(level);
    const currentLevelStart = this.getLevelStartExp(level);
    
    // 计算升级进度
    const progress = nextLevel
      ? Math.round(((footprintCount - currentLevelStart) / (nextLevel - currentLevelStart)) * 100)
      : 100;

    return {
      level,
      title,
      footprintCount,
      progress: Math.min(progress, 100),
      nextLevelRequirement: nextLevel,
      currentLevelStart,
    };
  }

  /**
   * 获取用户勋章列表
   */
  async getUserMedals(userId: number) {
    const userMedals = await this.prisma.userMedal.findMany({
      where: { userId },
      select: {
        medal: {
          select: {
            id: true,
            name: true,
            iconUrl: true,
            description: true,
            type: true,
          },
        },
        unlockedAt: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });

    return userMedals.map((um: any) => ({
      id: um.medal.id,
      name: um.medal.name,
      icon: um.medal.iconUrl,
      description: um.medal.description,
      type: um.medal.type,
      unlockedAt: um.unlockedAt.toISOString().split('T')[0],
    }));
  }

  /**
   * 获取用户打卡记录时间线
   */
  async getUserFootprints(userId: number, page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    const footprints = await this.prisma.footprint.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        museum: {
          select: {
            id: true,
            name: true,
            coverImage: true,
            city: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    const total = await this.prisma.footprint.count({
      where: { userId },
    });

    return {
      list: footprints.map((fp: any) => ({
        id: fp.id,
        museumId: fp.museum.id,
        museumName: fp.museum.name,
        museumImage: fp.museum.coverImage,
        city: fp.museum.city?.name || '未知',
        checkedAt: fp.createdAt.toISOString().split('T')[0],
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取用户收藏博物馆列表
   */
  async getUserCollections(userId: number, page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    const collections = await this.prisma.collection.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        museum: {
          select: {
            id: true,
            name: true,
            coverImage: true,
            province: {
              select: {
                name: true,
              },
            },
            city: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    const total = await this.prisma.collection.count({
      where: { userId },
    });

    // 按省份分组
    const groupedByProvince: Record<string, any[]> = {};
    collections.forEach((col: any) => {
      const province = col.museum.province?.name || '其他';
      if (!groupedByProvince[province]) {
        groupedByProvince[province] = [];
      }
      groupedByProvince[province].push({
        id: col.id,
        museumId: col.museum.id,
        museumName: col.museum.name,
        museumImage: col.museum.coverImage,
        city: col.museum.city?.name || '未知',
        collectedAt: col.createdAt.toISOString().split('T')[0],
      });
    });

    return {
      list: collections.map((col: any) => ({
        id: col.id,
        museumId: col.museum.id,
        museumName: col.museum.name,
        museumImage: col.museum.coverImage,
        province: col.museum.province?.name || '其他',
        city: col.museum.city?.name || '未知',
        collectedAt: col.createdAt.toISOString().split('T')[0],
      })),
      groupedByProvince,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取用户统计数据
   */
  async getUserStats(userId: number) {
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    const levelInfo = await this.getUserLevelInfo(userId);

    return {
      footprintCount: stats?.footprintCount || 0,
      provinceCount: stats?.provinceCount || 0,
      cityCount: stats?.cityCount || 0,
      shareCount: stats?.shareCount || 0,
      likeCount: stats?.likeCount || 0,
      level: levelInfo.level,
      title: levelInfo.title,
    };
  }

  /**
   * 计算用户等级
   */
  private calculateLevel(footprintCount: number): number {
    if (footprintCount >= 50) return 5;
    if (footprintCount >= 30) return 4;
    if (footprintCount >= 15) return 3;
    if (footprintCount >= 5) return 2;
    return 1;
  }

  /**
   * 计算用户称号
   */
  private calculateTitle(footprintCount: number): string {
    if (footprintCount >= 50) return '博物馆收藏家';
    if (footprintCount >= 30) return '博物馆达人';
    if (footprintCount >= 15) return '博物馆探索家';
    if (footprintCount >= 5) return '博物馆入门者';
    return '博物馆小白';
  }

  /**
   * 获取下一级所需打卡数
   */
  private getNextLevelRequirement(level: number): number | null {
    const requirements = [5, 15, 30, 50, null];
    return requirements[level - 1] || null;
  }

  /**
   * 获取当前等级起始打卡数
   */
  private getLevelStartExp(level: number): number {
    const starts = [0, 0, 5, 15, 30, 50];
    return starts[level] || 0;
  }
}