import { Injectable, NotFoundException, BadRequestException,InternalServerErrorException } from '@nestjs/common';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { UpdatePostCommentDto } from './dto/update-post-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PostComment } from 'src/schemas/post-comment.schema';
import { Model } from 'mongoose';
import { CacheService } from 'src/cache.service';

@Injectable()
export class PostCommentService {

  constructor(
    @InjectModel(PostComment.name) private postCommentModel: Model<PostComment>,
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
  
      const postIdCommentsCacheKey = `postIdComments_${postId}`;
      await this.cacheService.deleteCache(postIdCommentsCacheKey);
  
      return await createdPostComment.save();
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi tạo bình luận');
    }
  }

  async getCommentsByPostId(postId: string) {
    try {
      const postIdCommentsCacheKey = `postIdComments_${postId}`;
      console.log('try to get post comments from cache:', postIdCommentsCacheKey);

      const cached = await this.cacheService.getCache(postIdCommentsCacheKey)

      if (cached) {
        console.log('Cache HIT');
        return cached;
      }

      console.log('Cache MISS - fetching from DB...');

      const postComments = await this.postCommentModel.find({ post: postId })
        .populate({
          path: 'user',
          select: 'name avatarURL'
        })
        .exec();
      console.error('Post comments:', postComments);
      const validComments = postComments.filter(comment => comment.user !== null);

      console.log('Setting cache...');
      await this.cacheService.setCache(postIdCommentsCacheKey, validComments, 30 * 1000);

      return validComments;
    } catch (error) {
      console.error('Error fetching comments by postId:', error);
      throw new Error('Không thể lấy danh sách bình luận');
    }
  }

  async getCommentByUserId(userId: string) {
    try {
      const userIdCommentsCacheKey = `userIdComments_${userId}`;
      console.log('try to get user comments from cache:', userIdCommentsCacheKey);

      const cached = await this.cacheService.getCache(userIdCommentsCacheKey)

      if (cached) {
        console.log('Cache HIT');
        return cached;
      }

      console.log('Cache MISS - fetching from DB...');
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

      console.error('Post comments:', postComments);
      console.log('Setting cache...');
      await this.cacheService.setCache(userIdCommentsCacheKey, validComments, 30 * 1000);

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

}
