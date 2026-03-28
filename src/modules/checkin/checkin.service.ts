import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';
import { CreateCheckinDto, CheckinQueryDto } from './dto/create-checkin.dto';
import { calculateDistance, isWithinRange } from '../../utils/distance.util';
import { checkLevelUp } from '../../utils/level.util';
import { MedalCheckerService } from '../medal/medal-checker.service';

// GPS 打卡允许误差范围（米）
const CHECKIN_RANGE = 100;

// 打卡获得经验值
const CHECKIN_EXP = 10;

@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);

  constructor(
    private prisma: PrismaService,
    private medalChecker: MedalCheckerService,
  ) {}

  /**
   * 打卡
   */
  async checkin(userId: number, dto: CreateCheckinDto) {
    const museumId = Number(dto.museumId);

    // 1. 获取博物馆信息
    const museum = await this.prisma.museum.findUnique({
      where: { id: museumId },
    });

    if (!museum) {
      throw new BadRequestException('博物馆不存在');
    }

    if (!museum.latitude || !museum.longitude) {
      throw new BadRequestException('该博物馆暂不支持打卡');
    }

    // 2. 检查是否已打卡
    const existingCheckin = await this.prisma.checkIn.findUnique({
      where: {
        userId_museumId: { userId, museumId },
      },
    });

    if (existingCheckin) {
      throw new ForbiddenException('您已经打卡过这个博物馆了');
    }

    // 3. 计算距离
    const distance = calculateDistance(
      dto.latitude,
      dto.longitude,
      museum.latitude,
      museum.longitude,
    );

    if (!isWithinRange(distance, CHECKIN_RANGE)) {
      throw new BadRequestException(
        `您距离该博物馆还有 ${Math.round(distance)} 米，请靠近后再打卡（允许误差 ${CHECKIN_RANGE} 米）`,
      );
    }

    // 4. 创建打卡记录
    await this.prisma.checkIn.create({
      data: {
        userId,
        museumId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        distance: Math.round(distance),
        checkedAt: new Date(),
      },
    });

    // 5. 更新用户统计
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 检查是否是新省份
    const newProvinceCheckins = await this.prisma.checkIn.count({
      where: {
        userId,
        museum: { province: museum.province },
      },
    });
    const isNewProvince = newProvinceCheckins === 1;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        checkinCount: { increment: 1 },
        exp: { increment: CHECKIN_EXP },
        provinceCount: isNewProvince ? { increment: 1 } : undefined,
      },
    });

    // 6. 更新博物馆打卡数
    await this.prisma.museum.update({
      where: { id: museumId },
      data: { checkinCount: { increment: 1 } },
    });

    // 7. 检查勋章解锁
    const unlockedMedals = await this.medalChecker.checkAndUnlockMedals(userId);

    // 8. 检查升级
    const levelResult = checkLevelUp(user.level, user.exp, CHECKIN_EXP);

    // 如果解锁了勋章，增加勋章经验
    let totalExp = CHECKIN_EXP;
    if (unlockedMedals.length > 0) {
      const medalExp = unlockedMedals.reduce((sum, m) => sum + m.expReward, 0);
      totalExp += medalExp;

      // 更新用户经验和等级
      const finalLevel = checkLevelUp(user.level, user.exp, totalExp);
      await this.prisma.user.update({
        where: { id: userId },
        data: { level: finalLevel.newLevel },
      });
    }

    this.logger.log(
      `用户 ${userId} 打卡博物馆 ${museum.name}，距离 ${Math.round(distance)}米`,
    );

    return {
      success: true,
      exp: totalExp,
      message: `打卡成功！获得 ${totalExp} 经验值`,
      unlockedMedals: unlockedMedals.map((m) => ({
        id: m.id.toString(),
        name: m.name,
        expReward: m.expReward,
      })),
      levelUp: levelResult.leveledUp,
      newLevel: levelResult.newLevel,
    };
  }

  /**
   * 获取打卡记录
   */
  async getHistory(userId: number, query: CheckinQueryDto) {
    const { page = 1, limit = 20 } = query;

    const [list, total] = await Promise.all([
      this.prisma.checkIn.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { checkedAt: 'desc' },
        include: {
          museum: {
            select: {
              id: true,
              name: true,
              province: true,
              city: true,
              coverImage: true,
            },
          },
        },
      }),
      this.prisma.checkIn.count({ where: { userId } }),
    ]);

    return {
      list: list.map((c) => ({
        id: c.id.toString(),
        museum: {
          ...c.museum,
          id: c.museum.id.toString(),
        },
        checkedAt: c.checkedAt,
        distance: c.distance,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * 获取打卡统计
   */
  async getStatistics(userId: number) {
    const [totalCheckins, user] = await Promise.all([
      this.prisma.checkIn.count({ where: { userId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { provinceCount: true, medalCount: true },
      }),
    ]);

    // 获取各类型博物馆打卡数
    const checkins = await this.prisma.checkIn.findMany({
      where: { userId },
      select: { museumId: true },
    });

    const museumIds = checkins.map((c) => c.museumId);
    const museums = await this.prisma.museum.findMany({
      where: { id: { in: museumIds } },
      select: { id: true, type: true },
    });

    const typeCount: Record<string, number> = {};
    for (const museum of museums) {
      const type = museum.type || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    }

    return {
      total: totalCheckins,
      provinces: user?.provinceCount || 0,
      medals: user?.medalCount || 0,
      byType: typeCount,
    };
  }
}