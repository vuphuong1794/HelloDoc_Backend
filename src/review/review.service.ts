import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from 'src/schemas/review.schema';

@Injectable()
export class ReviewService {
    constructor(@InjectModel(Review.name) private readonly reviewModel: Model<Review>) { }

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
        return this.reviewModel
            .find({ doctor: doctorId })
            .populate('user', 'name userImage')
            .sort({ createdAt: -1 }); // Mới nhất lên đầu
    }
}
