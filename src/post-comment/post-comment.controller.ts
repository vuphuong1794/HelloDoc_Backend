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

  // @Get()
  // findAll() {
  //   return this.postCommentService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.postCommentService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updatePostCommentDto: UpdatePostCommentDto) {
  //   return this.postCommentService.update(+id, updatePostCommentDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.postCommentService.remove(+id);
  // }

  @Patch(':commentId/comment/update')
  updateComment(@Param('commentId') commentId: string, @Body() updatePostCommentDto: UpdatePostCommentDto) {
    return this.postCommentService.update(commentId, updatePostCommentDto);
  }

  @Delete(':commentId/comment/delete')
  removeComment(@Param('commentId') commentId: string) {
    return this.postCommentService.remove(commentId);
  }

}
