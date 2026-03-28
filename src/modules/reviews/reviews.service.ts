import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';

interface CreateRatingDto {
  museumId: number;
  score: number; // 1-5
}

interface CreateReviewDto {
  museumId: number;
  content: string;
  images?: string[];
  rating?: number;
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 为博物馆评分
   */
  async createRating(userId: number, dto: CreateRatingDto) {
    // 检查是否已评分
    const existing = await this.prisma.rating.findUnique({
      where: {
        userId_museumId: {
          userId,
          museumId: dto.museumId,
        },
      },
    });

    if (existing) {
      // 更新评分
      return this.prisma.rating.update({
        where: { id: existing.id },
        data: { score: dto.score },
      });
    }

    // 创建新评分
    return this.prisma.rating.create({
      data: {
        userId,
        museumId: dto.museumId,
        score: dto.score,
      },
    });
  }

  /**
   * 发表博物馆评论
   */
  async createReview(userId: number, dto: CreateReviewDto) {
    return this.prisma.review.create({
      data: {
        userId,
        museumId: dto.museumId,
        content: dto.content,
        images: dto.images ? JSON.stringify(dto.images) : null,
        rating: dto.rating,
      },
    });
  }

  /**
   * 获取博物馆评分统计
   */
  async getMuseumRatingStats(museumId: number) {
    const ratings = await this.prisma.rating.findMany({
      where: { museumId },
      select: { score: true },
    });

    const total = ratings.length;
    const avgScore = total > 0 
      ? ratings.reduce((sum, r) => sum + r.score, 0) / total 
      : 0;

    // 统计各星级数量
    const scoreDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    ratings.forEach((r) => {
      scoreDistribution[r.score as keyof typeof scoreDistribution]++;
    });

    return {
      avgScore: Number(avgScore.toFixed(1)),
      total,
      distribution: scoreDistribution,
    };
  }

  /**
   * 获取博物馆评论列表
   */
  async getMuseumReviews(museumId: number, page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    const reviews = await this.prisma.review.findMany({
      where: { museumId, isActive: true },
      select: {
        id: true,
        content: true,
        images: true,
        rating: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            reviewLikes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    const total = await this.prisma.review.count({
      where: { museumId, isActive: true },
    });

    return {
      list: reviews.map((r: any) => ({
        id: r.id,
        content: r.content,
        images: r.images ? JSON.parse(r.images) : [],
        rating: r.rating,
        createdAt: r.createdAt.toISOString().split('T')[0],
        user: r.user,
        likeCount: r._count.reviewLikes,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 点赞评论
   */
  async likeReview(userId: number, reviewId: number) {
    // 检查是否已点赞
    const existing = await this.prisma.reviewLike.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    if (existing) {
      // 取消点赞
      await this.prisma.reviewLike.delete({
        where: { id: existing.id },
      });
      return { liked: false };
    }

    // 点赞
    await this.prisma.reviewLike.create({
      data: {
        userId,
        reviewId,
      },
    });
    return { liked: true };
  }

  /**
   * 获取用户评分过的博物馆列表
   */
  async getUserRatings(userId: number, page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    const ratings = await this.prisma.rating.findMany({
      where: { userId },
      select: {
        id: true,
        score: true,
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

    const total = await this.prisma.rating.count({
      where: { userId },
    });

    return {
      list: ratings.map((r: any) => ({
        id: r.id,
        score: r.score,
        museumId: r.museum.id,
        museumName: r.museum.name,
        museumImage: r.museum.coverImage,
        city: r.museum.city?.name || '未知',
        createdAt: r.createdAt.toISOString().split('T')[0],
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取用户发表的评论列表
   */
  async getUserReviews(userId: number, page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    const reviews = await this.prisma.review.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        content: true,
        images: true,
        rating: true,
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
            reviewLikes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    const total = await this.prisma.review.count({
      where: { userId, isActive: true },
    });

    return {
      list: reviews.map((r: any) => ({
        id: r.id,
        content: r.content,
        images: r.images ? JSON.parse(r.images) : [],
        rating: r.rating,
        museumId: r.museum.id,
        museumName: r.museum.name,
        museumImage: r.museum.coverImage,
        likeCount: r._count.reviewLikes,
        createdAt: r.createdAt.toISOString().split('T')[0],
      })),
      total,
      page,
      pageSize,
    };
  }
}