import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';

interface RecordShareDto {
  museumId?: number;
  content?: string;
  images?: string[];
  type?: string;
  channel?: string;
}

@Injectable()
export class SharesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 记录分享行为
   */
  async recordShare(userId: number, data: RecordShareDto) {
    // 创建分享记录
    const shareData: any = {
      userId,
      content: data.content || '',
      images: data.images ? JSON.stringify(data.images) : null,
    };
    
    if (data.museumId) {
      shareData.museumId = data.museumId;
    }

    const share = await this.prisma.share.create({
      data: shareData,
    });

    // 更新用户分享统计
    await this.prisma.userStats.upsert({
      where: { userId },
      update: {
        shareCount: { increment: 1 },
      },
      create: {
        userId,
        shareCount: 1,
      },
    });

    return share;
  }

  /**
   * 获取用户分享列表
   */
  async getUserShares(userId: number, page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    const shares = await this.prisma.share.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        content: true,
        images: true,
        createdAt: true,
        museum: {
          select: {
            id: true,
            name: true,
            coverImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    const total = await this.prisma.share.count({
      where: { userId, isActive: true },
    });

    return {
      list: shares,
      total,
      page,
      pageSize,
    };
  }
}