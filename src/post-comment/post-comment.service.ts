import { Injectable } from '@nestjs/common';
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

  create(createPostCommentDto: CreatePostCommentDto) {
    const createdPostComment = new this.postCommentModel({
        user: createPostCommentDto.userId,
        userModel: createPostCommentDto.userModel,
        post: createPostCommentDto.postId,
        comment: createPostCommentDto.comment,
    });

    return createdPostComment.save();
  }

  findAll() {
    return `This action returns all postComment`;
  }

  findOne(id: number) {
    return `This action returns a #${id} postComment`;
  }

  update(id: number, updatePostCommentDto: UpdatePostCommentDto) {
    return `This action updates a #${id} postComment`;
  }

  remove(id: number) {
    return `This action removes a #${id} postComment`;
  }
}
