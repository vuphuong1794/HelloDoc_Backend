import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostFavorite } from 'src/schemas/post-favorite.schema';
import { Model } from 'mongoose';
import { CreatePostFavoriteDto } from './dto/create-post-favorite.dto';
import { GetPostFavoriteDto } from './dto/get-post-favorite.dto';
import { CacheService } from 'src/cache.service';
import { Doctor } from 'src/schemas/doctor.schema';
import { User } from 'src/schemas/user.schema';
import { Post } from 'src/schemas/Post.schema';
import * as admin from 'firebase-admin';
import { Notification } from 'src/schemas/notification.schema';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class PostFavoriteService {
  constructor(
    @InjectModel(PostFavorite.name) private postFavoriteModel: Model<PostFavorite>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>, // Assuming Notification schema is similar to PostComment
    private cacheService: CacheService,
    private notificationService: NotificationService,
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
        const post = await this.postModel.findById(postId);
        if (!post) {
          console.warn(`Bài viết với ID ${postId} không tồn tại`);
          return;  // Hoặc trả về lỗi nếu cần thiết 
        }

        const userId = post?.user instanceof Object ? post?.user.toString() : post?.user;
        const userModel = post?.userModel;
        if (userId != createPostFavoriteDto.userId) {
          let user;
          if (createPostFavoriteDto.userModel == "Doctor") {
            user = await this.doctorModel.findById(createPostFavoriteDto.userId);
            console.log("User là bác sĩ: " + user)
          } else if (createPostFavoriteDto.userModel == "User") {
            user = await this.userModel.findById(createPostFavoriteDto.userId);
            console.log("User là người dùng: " + user)
          }
          const username = user?.name
          this.notifyFavorite(userId, userModel, `${username} đã thích bài viết của bạn`,postId);
        }
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

      return postFavorites;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bình luận:', error);
      throw new InternalServerErrorException('Không thể lấy danh sách bình luận');
    }
  }

  async notifyFavorite(userId: string, userModel: string, message: string, postId: string) {
    try {
      // Tạo thông báo cho người dùng
      const user = await this.userModel.findById(userId);
      const notification = {
        userId: userId,
        userModel: userModel,
        type: 'ForPost',
        content: message,
        navigatePath: `post-detail/${postId}`,
      };
      await this.notificationService.createNotification(notification);
      if (userModel == 'User') {
        const user = await this.userModel.findById(userId);
        if (user) {
          if (user?.fcmToken) {
            await admin.messaging().send({
              token: user.fcmToken,
              notification: {
                title: 'HelloDoc',
                body: message,
              },
              data: {
                bigText: message, // Truyền toàn bộ nội dung dài ở đây
              },
            });
            console.log(`Đã gửi thông báo đến người dùng ${userId}`);
            return
          } else {
            console.warn(`Người dùng ${userId} không có fcmToken`);
            return
          }
        }
      } else if (userModel == 'Doctor') {
        const doctor = await this.doctorModel.findById(userId);
        if (doctor) {
          if (doctor?.fcmToken) {
            await admin.messaging().send({
              token: doctor.fcmToken,
              notification: {
                title: 'HelloDoc',
                body: message,
              },
              data: {
                bigText: message, // Truyền toàn bộ nội dung dài ở đây
              },
            });
            console.log(`Đã gửi thông báo đến người dùng ${userId}`);
            return
          } else {
            console.warn(`Người dùng ${userId} không có fcmToken`);
            return
          }
        }
      }
    } catch (error) {
      console.error(`Lỗi khi gửi thông báo đến bác sĩ ${userId}:`, error);
    }
  }
}
