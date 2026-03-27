import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';

@Injectable()
export class PosterService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户海报数据（聚合数据用于生成海报）
   */
  async getPosterData(userId: number) {
    // 1. 获取用户基本信息
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 2. 获取用户统计数据
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
      select: {
        footprintCount: true,
        provinceCount: true,
        cityCount: true,
        shareCount: true,
        likeCount: true,
      },
    });

    // 3. 获取用户打卡过的省份列表
    const footprints = await this.prisma.footprint.findMany({
      where: { userId },
      select: {
        museum: {
          select: {
            province: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // 构建省份 Map
    const provinceMap: Record<string, boolean> = {};
    for (const fp of footprints) {
      if (fp.museum?.province?.name) {
        provinceMap[fp.museum.province.name] = true;
      }
    }

    // 4. 获取用户已解锁的勋章
    const userMedals = await this.prisma.userMedal.findMany({
      where: { userId },
      select: {
        medal: {
          select: {
            name: true,
            iconUrl: true,
            description: true,
          },
        },
        unlockedAt: true,
      },
      orderBy: { unlockedAt: 'desc' },
      take: 8, // 只展示最近的8个勋章
    });

    const medals = userMedals.map((um: any) => ({
      name: um.medal.name,
      icon: um.medal.iconUrl,
      description: um.medal.description,
      unlockedAt: um.unlockedAt.toISOString().split('T')[0],
    }));

    // 5. 获取最近打卡的博物馆（最多5个）
    const recentFootprints = await this.prisma.footprint.findMany({
      where: { userId },
      select: {
        museum: {
          select: {
            name: true,
            city: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentMuseums = recentFootprints.map((fp: any) => ({
      name: fp.museum.name,
      city: fp.museum.city?.name || '未知',
      checkedAt: fp.createdAt.toISOString().split('T')[0],
    }));

    // 6. 计算用户等级和称号
    const footprintCount = stats?.footprintCount || 0;
    const level = this.calculateLevel(footprintCount);
    const title = this.calculateTitle(footprintCount);

    // 7. 生成二维码 URL（APP 下载二维码）
    const qrCode = 'https://oss.museumapp.cn/qr/download.png';

    return {
      user: {
        nickname: user.nickname || '博物馆爱好者',
        avatar: user.avatar,
        level,
        title,
      },
      stats: {
        totalMuseums: stats?.footprintCount || 0,
        totalProvinces: stats?.provinceCount || 0,
        totalCities: stats?.cityCount || 0,
      },
      provinceMap,
      medals,
      recentMuseums,
      qrCode,
    };
  }

  /**
   * 根据打卡数量计算用户等级
   */
  private calculateLevel(footprintCount: number): number {
    if (footprintCount >= 50) return 5;
    if (footprintCount >= 30) return 4;
    if (footprintCount >= 15) return 3;
    if (footprintCount >= 5) return 2;
    return 1;
  }

  /**
   * 根据打卡数量计算用户称号
   */
  private calculateTitle(footprintCount: number): string {
    if (footprintCount >= 50) return '博物馆收藏家';
    if (footprintCount >= 30) return '博物馆达人';
    if (footprintCount >= 15) return '博物馆探索家';
    if (footprintCount >= 5) return '博物馆入门者';
    return '博物馆小白';
  }
}