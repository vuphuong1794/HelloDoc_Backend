import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from 'src/post/dto/createPost.dto';
import { UpdatePostDto } from 'src/dtos/updatePost.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) { }

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
  @UseInterceptors(FilesInterceptor('images'))
  async updatePost(
    @Param('id') id: string,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() updatePostDto: UpdatePostDto,
  ) {
    updatePostDto.images = images;
    return this.postService.update(id, updatePostDto);
  }


  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.postService.delete(id);
  }
}
