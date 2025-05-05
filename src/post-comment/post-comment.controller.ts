import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PostCommentService } from './post-comment.service';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { UpdatePostCommentDto } from './dto/update-post-comment.dto';

@Controller('post')
export class PostCommentController {
  constructor(private readonly postCommentService: PostCommentService) { }

  @Post(':postId/comment/create')
  async createCommentByPostId(
    @Param('postId') postId: string,
    @Body() createPostCommentDto: CreatePostCommentDto
  ) {
    return this.postCommentService.createCommentByPostId(postId, createPostCommentDto);
  }

  @Get(':postId/comment/get')
  async getCommentsByPostId(@Param('postId') postId: string) {
    return this.postCommentService.getCommentsByPostId(postId);
  }

  @Get('user/:userId/comment/get')
  async getCommentByUserId(@Param('userId') userId: string) {
    return this.postCommentService.getCommentByUserId(userId);
  }


  @Patch(':commentId/comment/update')
  updateComment(@Param('commentId') commentId: string, @Body() updatePostCommentDto: UpdatePostCommentDto) {
    return this.postCommentService.update(commentId, updatePostCommentDto);
  }

  @Delete(':commentId/comment/delete')
  removeComment(@Param('commentId') commentId: string) {
    return this.postCommentService.remove(commentId);
  }

}
