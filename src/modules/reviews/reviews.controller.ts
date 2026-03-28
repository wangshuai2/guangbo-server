import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ==================== 评分接口 ====================

  @Post('ratings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '为博物馆评分（1-5星）' })
  async createRating(@Request() req: any, @Body() body: { museumId: number; score: number }) {
    const rating = await this.reviewsService.createRating(req.user.userId, body);
    return {
      code: 0,
      data: rating,
      message: '评分成功',
    };
  }

  @Get('museums/:museumId/ratings')
  @ApiOperation({ summary: '获取博物馆评分统计' })
  async getMuseumRatingStats(@Param('museumId') museumId: string) {
    const stats = await this.reviewsService.getMuseumRatingStats(Number(museumId));
    return {
      code: 0,
      data: stats,
    };
  }

  @Get('me/ratings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我评分过的博物馆列表' })
  async getUserRatings(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    const result = await this.reviewsService.getUserRatings(
      req.user.userId,
      Number(page),
      Number(pageSize),
    );
    return {
      code: 0,
      data: result,
    };
  }

  // ==================== 评论接口 ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发表博物馆评论' })
  async createReview(
    @Request() req: any,
    @Body() body: { museumId: number; content: string; images?: string[]; rating?: number },
  ) {
    const review = await this.reviewsService.createReview(req.user.userId, body);
    return {
      code: 0,
      data: {
        id: review.id,
        createdAt: review.createdAt,
      },
      message: '评论发表成功',
    };
  }

  @Get('museums/:museumId')
  @ApiOperation({ summary: '获取博物馆评论列表' })
  async getMuseumReviews(
    @Param('museumId') museumId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    const result = await this.reviewsService.getMuseumReviews(
      Number(museumId),
      Number(page),
      Number(pageSize),
    );
    return {
      code: 0,
      data: result,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我发表的评论列表' })
  async getUserReviews(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    const result = await this.reviewsService.getUserReviews(
      req.user.userId,
      Number(page),
      Number(pageSize),
    );
    return {
      code: 0,
      data: result,
    };
  }

  // ==================== 点赞接口 ====================

  @Post(':reviewId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞/取消点赞评论' })
  async likeReview(@Request() req: any, @Param('reviewId') reviewId: string) {
    const result = await this.reviewsService.likeReview(req.user.userId, Number(reviewId));
    return {
      code: 0,
      data: result,
      message: result.liked ? '点赞成功' : '取消点赞',
    };
  }
}