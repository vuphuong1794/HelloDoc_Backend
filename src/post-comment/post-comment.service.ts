import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { UpdatePostCommentDto } from './dto/update-post-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PostComment } from 'src/schemas/post-comment.schema';
import { Model } from 'mongoose';

@Injectable()
export class PostCommentService {

  constructor(
          @InjectModel(PostComment.name) private postCommentModel: Model<PostComment>,
      ) { }

  async createCommentByPostId(postId: string, createPostCommentDto: CreatePostCommentDto) {
    const createdPostComment = new this.postCommentModel({
        user: createPostCommentDto.userId,
        userModel: createPostCommentDto.userModel,
        post: postId,
        content: createPostCommentDto.content,
    });

    return createdPostComment.save();
    // return { message: 'Comment added' };
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

  // async findAll() {
  //   return `This action returns all postComment`;
  // }

  // async findOne(id: number) {
  //   return `This action returns a #${id} postComment`;
  // }

  // async update(id: number, updatePostCommentDto: UpdatePostCommentDto) {
  //   return `This action updates a #${id} postComment`;
  // }

  // async remove(id: number) {
  //   return `This action removes a #${id} postComment`;
  // }

}
