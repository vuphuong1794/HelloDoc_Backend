import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostFavorite } from 'src/schemas/post-favorite.schema';
import { Model } from 'mongoose';
import { CreatePostFavoriteDto } from './dto/create-post-favorite.dto';
import { GetPostFavoriteDto } from './dto/get-post-favorite.dto';
import { CacheService } from 'src/cache.service';
import { Doctor } from 'src/schemas/doctor.schema';
import { User } from 'src/schemas/user.schema';
import * as admin from 'firebase-admin';

@Injectable()
export class PostFavoriteService {
  constructor(
    @InjectModel(PostFavorite.name) private postFavoriteModel: Model<PostFavorite>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    private cacheService: CacheService,
  ) { }

  async getPostFavoritesByPostId(postId: string, getPostFavoriteDto: GetPostFavoriteDto) {
    try {
      const postFavorite = await this.postFavoriteModel.findOne({
        user: getPostFavoriteDto.userId,
        post: postId,
      });
  
      const totalFavorites = await this.postFavoriteModel.countDocuments({ post: postId });
  
      return {
        isFavorited: !!postFavorite,
        totalFavorites,
      };
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi lấy thông tin lượt yêu thích bài viết');
    }
  }

  async updatePostFavoriteByPostId(postId: string, createPostFavoriteDto: CreatePostFavoriteDto) {
    try {
      const postFavorite = await this.postFavoriteModel.findOne({
        user: createPostFavoriteDto.userId,
        post: postId,
      });

      if (postFavorite) {
        // Nếu đã like trước đó, thì unlike (xóa document)
        await this.postFavoriteModel.deleteOne({ _id: postFavorite._id });
        const totalFavorites = await this.postFavoriteModel.countDocuments({ post: postId });
        return { isFavorited: false, totalFavorites };
      } else {
        // Nếu chưa like, thì tạo mới
        await this.postFavoriteModel.create({
          user: createPostFavoriteDto.userId,
          userModel: createPostFavoriteDto.userModel,
          post: postId,
        });
        const totalFavorites = await this.postFavoriteModel.countDocuments({ post: postId });
        return { isFavorited: true, totalFavorites };
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật favorite:', error);
      throw new InternalServerErrorException('Không thể cập nhật trạng thái yêu thích');
    }
  }

  async getPostFavoritesByUserId(userId: string) {
    try {
      const postIdFavoritesCacheKey = `userIdFavorites_${userId}`;
      console.log('try to get post favorites from cache:', postIdFavoritesCacheKey);

      const cached = await this.cacheService.getCache(postIdFavoritesCacheKey)
      if (cached) {
        console.log('Cache HIT');
        return cached;
      }

      console.log('Cache MISS - fetching from DB...');
      const postFavorites = await this.postFavoriteModel.find({ user: userId })
        .populate({
          path: 'post',
          select: 'media content',
        })
        .populate({
          path: 'user',
          select: 'name avatarURL'
        })
        .exec();

      console.log('setting cache...');
      await this.cacheService.setCache(postIdFavoritesCacheKey, postFavorites, 30 * 1000);

      return postFavorites;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bình luận:', error);
      throw new InternalServerErrorException('Không thể lấy danh sách bình luận');
    }
  }

  async notifyFavorite(doctorId: string, message: string) {
      try {
          const doctor = await this.doctorModel.findById(doctorId);
          if (doctor?.fcmToken) {
              await admin.messaging().send({
                  token: doctor.fcmToken,
                  notification: {
                      title: 'Thông báo lịch hẹn mới',
                      body: message,
                  },
              });
              console.log(`Đã gửi thông báo đến bác sĩ ${doctorId}`);
          } else {
              console.warn(`Bác sĩ ${doctorId} không có fcmToken`);
          }
      } catch (error) {
          console.error(`Lỗi khi gửi thông báo đến bác sĩ ${doctorId}:`, error);
      }
  }
}
