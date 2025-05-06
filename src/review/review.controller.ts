import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CacheService } from 'src/cache.service';

@Controller('review')
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly cacheService: CacheService
  ) { }

  @Post()
  async createReview(@Body() body: { userId: string; doctorId: string; rating: number; comment: string }) {
    return this.reviewService.createReview(body);
  }

  @Get('doctor/:doctorId')
  async getReviewsByDoctor(@Param('doctorId') doctorId: string) {

    const cacheKey = `reviews_by_doctor_${doctorId}`;
    console.log('Trying to get user posts from cache...');

    const cached = await this.cacheService.getCache(cacheKey);
    if (cached) {
      console.log('Cache HIT');
      return cached;
    }

    console.log('Cache MISS - querying DB');
    const data = await this.reviewService.getReviewsByDoctor(doctorId);

    console.log('Setting cache...');
    await this.cacheService.setCache(cacheKey, data, 30 * 1000); // Cache for 1 hour
    return data;
  }

  @Patch(':reviewId')
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Body() body: { rating: number; comment: string }
  ) {
    return this.reviewService.updateReview(reviewId, body);
  }

  @Delete(':reviewId')
  async deleteReview(@Param('reviewId') reviewId: string) {
    return this.reviewService.deleteReview(reviewId);
  }

}
