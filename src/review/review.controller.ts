import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { ReviewService } from './review.service';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) { }

  @Post()
  async createReview(@Body() body: { userId: string; doctorId: string; rating: number; comment: string }) {
    return this.reviewService.createReview(body);
  }

  @Get('doctor/:doctorId')
  async getReviewsByDoctor(@Param('doctorId') doctorId: string) {
    return this.reviewService.getReviewsByDoctor(doctorId);
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
