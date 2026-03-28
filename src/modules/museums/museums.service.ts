import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';
import { QueryMuseumDto } from './dto/query-museum.dto';

@Injectable()
export class MuseumsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取博物馆列表
   */
  async findAll(query: QueryMuseumDto) {
    const { province, city, type, isFree, rating, keyword, page = 1, pageSize = 20 } = query;

    const where: any = { status: 0 };

    if (province) {
      where.province = province;
    }

    if (city) {
      where.city = city;
    }

    if (type) {
      where.type = type;
    }

    if (isFree !== undefined) {
      where.isFree = isFree ? 1 : 0;
    }

    if (rating) {
      where.rating = { gte: rating };
    }

    if (keyword) {
      where.name = { contains: keyword };
    }

    const [list, total] = await Promise.all([
      this.prisma.museum.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ rating: 'desc' }, { checkinCount: 'desc' }],
        select: {
          id: true,
          name: true,
          province: true,
          city: true,
          address: true,
          coverImage: true,
          type: true,
          isFree: true,
          rating: true,
          ratingCount: true,
          checkinCount: true,
        },
      }),
      this.prisma.museum.count({ where }),
    ]);

    return {
      list: list.map((m) => ({
        ...m,
        id: m.id.toString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
      },
    };
  }

  /**
   * 获取博物馆详情
   */
  async findOne(id: number, userId?: number) {
    const museum = await this.prisma.museum.findUnique({
      where: { id },
      include: {
        treasures: {
          where: { status: 0 },
          orderBy: { sortOrder: 'asc' },
          take: 5,
        },
      },
    });

    if (!museum) {
      throw new NotFoundException('博物馆不存在');
    }

    // 更新浏览量
    await this.prisma.museum.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // 检查用户是否已打卡/收藏
    let isCheckin = false;
    let isFavorited = false;

    if (userId) {
      const [checkin, favorite] = await Promise.all([
        this.prisma.checkIn.findUnique({
          where: { userId_museumId: { userId, museumId: id } },
        }),
        this.prisma.favorite.findUnique({
          where: { userId_museumId: { userId, museumId: id } },
        }),
      ]);
      isCheckin = !!checkin;
      isFavorited = !!favorite;
    }

    return {
      ...museum,
      id: museum.id.toString(),
      treasures: museum.treasures.map((t) => ({
        ...t,
        id: t.id.toString(),
      })),
      isCheckin,
      isFavorited,
    };
  }

  /**
   * 获取附近博物馆
   */
  async findNearby(latitude: number, longitude: number, distance = 5000, limit = 10) {
    const museums = await this.prisma.museum.findMany({
      where: {
        status: 0,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        address: true,
        coverImage: true,
        rating: true,
        latitude: true,
        longitude: true,
      },
    });

    // 计算距离并排序
    const withDistance = museums
      .map((m) => {
        const dist = this.calculateDistance(
          latitude,
          longitude,
          m.latitude!,
          m.longitude!,
        );
        return { ...m, distance: dist, id: m.id.toString() };
      })
      .filter((m) => m.distance <= distance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return { list: withDistance };
  }

  /**
   * 计算两点距离（米）
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}