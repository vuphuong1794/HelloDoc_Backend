import { Controller, Get, Post, Body, Patch, Param, Delete,Query } from '@nestjs/common';
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
    console.log("ID bai viet dc cmt la: "+postId)
    console.log("Noi dung cmt la: "+createPostCommentDto+" "+createPostCommentDto.content)

    return this.postCommentService.createCommentByPostId(postId, createPostCommentDto);
  }

@Get(':postId/comment/get')
async getCommentsByPostId(
  @Param('postId') postId: string,
  @Query('limit') limit = '10',
  @Query('skip') skip = '0',
) {
  const limitNum = parseInt(limit);
  const skipNum = parseInt(skip);
  console.log("limitNum "+limitNum+" skipNum "+skipNum)
  return this.postCommentService.getCommentsByPostId(postId, limitNum, skipNum);
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
