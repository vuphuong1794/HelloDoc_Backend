import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from 'src/post/dto/createPost.dto';
import { UpdatePostDto } from 'src/dtos/updatePost.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) { }

  // @Post('book')
  // async create(@Body() createPostDto: CreatePostDto) {
  //   return this.postService.create(createPostDto);
  // }

  @Post('create')
  @UseInterceptors(FilesInterceptor('images')) // 'images' là tên field form-data
  async createPost(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createPostDto: CreatePostDto,
  ) {
    if (files && files.length > 0) {
      createPostDto.images = files;
    }
    return this.postService.create(createPostDto);
  }

  @Get()
  async getAll() {
    return this.postService.getAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.postService.getOne(id);
  }

  @Get('getById/:id')
  async getById(@Param('id') id: string) {
    return this.postService.getById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(id, updatePostDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.postService.delete(id);
  }

  @Post(':id/like')
  async likePost(@Param('id') id: string, @Body('userId') userId: string) {
    return this.postService.toggleLike(id, userId);
  }

  @Post(':id/comment')
  async addComment(
    @Param('id') postId: string,
    @Body() body: { userId: string; content: string }
  ) {
    return this.postService.addComment(postId, body.userId, body.content);
  }

  @Get(':id/comments')
  async getComments(@Param('id') postId: string) {
    return this.postService.getComments(postId);
  }

}
