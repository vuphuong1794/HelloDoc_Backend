import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    const createdPostComment = new this.postCommentModel({
      user: createPostCommentDto.userId,
      userModel: createPostCommentDto.userModel,
      post: postId,
      content: createPostCommentDto.content,
    });

    //xóa cache comments của postId
    const postIdCommentsCacheKey = `postIdComments_${postId}`;
    await this.cacheService.deleteCache(postIdCommentsCacheKey);

    return createdPostComment.save();
    // return { message: 'Comment added' };
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
      throw new Error('Không thể lấy danh sách bình luận');
    }
  }

}
