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

@Injectable()
export class PostCommentService {

  constructor(
    @InjectModel(PostComment.name) private postCommentModel: Model<PostComment>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    @InjectModel(Post.name) private postModel: Model<Post>,
    private cacheService: CacheService,
  ) { }

  async createCommentByPostId(postId: string, createPostCommentDto: CreatePostCommentDto) {
    try {
      const createdPostComment = new this.postCommentModel({
        user: createPostCommentDto.userId,
        userModel: createPostCommentDto.userModel,
        post: postId,
        content: createPostCommentDto.content,
      });

      const post = await this.postModel.findById(postId);
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
        } else if (createPostCommentDto.userModel == "User") {
          user = await this.userModel.findById(createPostCommentDto.userId);
        }
        const username = user?.name
        this.notifyComment(userId, userModel, `${username} đã bình luận bài viết của bạn`);
      }

      return await createdPostComment.save();
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi tạo bình luận');
    }
  }

  async getCommentsByPostId(postId: string) {
    try {
      const postComments = await this.postCommentModel.find({ post: postId })
        .populate({
          path: 'user',
          select: 'name avatarURL'
        })
        .exec();
      console.error('Post comments:', postComments);
      const validComments = postComments.filter(comment => comment.user !== null);

      return validComments;
    } catch (error) {
      console.error('Error fetching comments by postId:', error);
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
