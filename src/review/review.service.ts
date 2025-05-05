import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CacheService } from 'src/cache.service';
import { Review } from 'src/schemas/review.schema';

@Injectable()
export class ReviewService {
    constructor(
        @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
        private cacheService: CacheService,
    ) { }

    async createReview(body: { userId: string; doctorId: string; rating: number; comment: string }) {
        const review = new this.reviewModel({
            user: body.userId,
            doctor: body.doctorId,
            rating: body.rating,
            comment: body.comment
        });
        return review.save();
    }

    async getReviewsByDoctor(doctorId: string) {
        const reviews = await this.reviewModel
            .find({ doctor: doctorId })
            .populate('user', 'name avatarURL')
            .sort({ createdAt: -1 }); // Mới nhất lên đầu

        return reviews;
    }

    async updateReview(reviewId: string, body: { rating: number; comment: string }) {
        return this.reviewModel.findByIdAndUpdate(
            reviewId,
            { rating: body.rating, comment: body.comment },
            { new: true }
        );
    }

    async deleteReview(reviewId: string) {
        return this.reviewModel.findByIdAndDelete(reviewId);
    }

}
