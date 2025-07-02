import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { UpdatePostCommentDto } from './dto/update-post-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PostComment } from 'src/schemas/post-comment.schema';
import { Model } from 'mongoose';
import { Doctor } from 'src/schemas/doctor.schema';
import { User } from 'src/schemas/user.schema';
import { Post } from 'src/schemas/Post.schema';
import { CacheService } from 'src/cache.service';
import * as admin from 'firebase-admin';
import { Notification } from 'src/schemas/notification.schema';
import { NotificationService } from 'src/notification/notification.service';
import { CreateNotificationDto } from 'src/notification/dto/create-notification.dto';

@Injectable()
export class PostCommentService {

  constructor(
    @InjectModel(PostComment.name) private postCommentModel: Model<PostComment>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private cacheService: CacheService,
    private notificationService: NotificationService,
  ) { }

  async createCommentByPostId(postId: string, createPostCommentDto: CreatePostCommentDto) {
    try {
      const createdPostComment = new this.postCommentModel({
        user: createPostCommentDto.userId,
        userModel: createPostCommentDto.userModel,
        post: postId,
        content: createPostCommentDto.content,
      });
      console.log("Noi dung cmt vao service la: "
        +createPostCommentDto.userId
        +" "+createPostCommentDto.userModel
      +" "+postId
      +" "+createPostCommentDto.content)


      const post = await this.postModel.findById(postId);
      const postUserId = post?.user instanceof Object ? post?.user.toString() : post?.user;
      if (!post) {
        console.warn(`Bài viết với ID ${postId} không tồn tại`);
        return;  // Hoặc trả về lỗi nếu cần thiết
      }

      const userId = post?.user instanceof Object ? post?.user.toString() : post?.user;
      const userModel = post?.userModel;
      if (userId != createPostCommentDto.userId) {
        let user;
        if (createPostCommentDto.userModel == "Doctor") {
          user = await this.doctorModel.findById(createPostCommentDto.userId);
          console.log("User la bac si: "+user)
        } else if (createPostCommentDto.userModel == "User") {
          user = await this.userModel.findById(createPostCommentDto.userId);
          console.log("User la nguoi dung: "+user)
        }
        const username = user?.name
        this.notifyComment(userId, userModel, `${username} đã bình luận bài viết của bạn`);
      }
      console.log("Gui thanh cong: "+createdPostComment)

      // Tạo thông báo cho người dùng
      const user = await this.userModel.findById(userId);
      const notification = {
        userId: userId,
        userModel: userModel,
        type: 'ForPost',
        content: `${user?.name} đã bình luận bài viết của bạn`,
        navigatePath: `post-detail/${postId}`,
      };
      if(userId != postUserId) {
        await this.notificationService.createNotification(notification);
      }
    
      return await createdPostComment.save();
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi tạo bình luận');
    }
  }


async getCommentsByPostId(postId: string, limit = 10, skip = 0) {
  try {
    // Truy vấn dư ra 1 phần tử để kiểm tra còn hay không
    const postComments = await this.postCommentModel.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .populate({
        path: 'user',
        select: 'name avatarURL'
      })
      .exec();

    // Chỉ giữ lại những comment có user hợp lệ
    const filteredComments = postComments.filter(comment => comment.user !== null);

    // Lấy đúng số lượng comment cần trả về
    const comments = filteredComments.slice(0, limit);

    // Kiểm tra còn dữ liệu không
    const hasMore = filteredComments.length > limit;

    return {
      comments,
      hasMore
    };
  } catch (error) {
    console.error('Lỗi khi lấy bình luận:', error);
    throw new Error('Không thể lấy danh sách bình luận');
  }
}




  async getCommentByUserId(userId: string) {
    try {
      const postComments = await this.postCommentModel.find({ user: userId })
        .populate({
          path: 'post',
          select: 'media content',
        })
        .populate({
          path: 'user',
          select: 'name avatarURL'
        })
        .exec();
      const validComments = postComments.filter(comment => comment.user !== null);

      //console.error('Post comments:', postComments);

      return validComments;
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi lấy thông tin danh sách bình luận');
    }
  }

  async update(id: string, updatePostCommentDto: UpdatePostCommentDto) {
    try {
      const updatedComment = await this.postCommentModel.findByIdAndUpdate(
        id,
        updatePostCommentDto,
        { new: true }
      );

      if (!updatedComment) {
        throw new NotFoundException(`Không tìm thấy comment với id ${id}`);
      }

      return updatedComment;
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi cập nhật bình luận');
    }
  }

  async remove(id: string) {
    try {
      const deletedComment = await this.postCommentModel.findByIdAndDelete(id);

      if (!deletedComment) {
        throw new NotFoundException(`Không tìm thấy comment để xóa với id ${id}`);
      }

      return { message: 'Xóa bình luận thành công' };
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi xóa bình luận');
    }
  }

  async notifyComment(userId: string, userModel: string, message: string) {
    try {
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
