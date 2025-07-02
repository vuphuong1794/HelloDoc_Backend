import { Query, Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from 'src/post/dto/createPost.dto';
import { UpdatePostDto } from 'src/dtos/updatePost.dto';
import {
  FilesInterceptor,
  FileFieldsInterceptor
} from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) { }

  @Post('create')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'videos', maxCount: 10 }
    ]),
  ) // 'images' là tên field form-data
  async createPost(
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[]
    },
    @Body() createPostDto: CreatePostDto,
  ) {
    console.log(createPostDto);
    return this.postService.create(createPostDto, files);
  }

  @Get()
  async getAll(
    @Query('limit') limit = '10',
    @Query('skip') skip = '0'
  ) {
    const limitNum = parseInt(limit);
    const skipNum = parseInt(skip);
    return this.postService.getAll(limitNum, skipNum);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.postService.getOne(id);
  }

  @Get('get-by-user-id/:id')
  async getByUserId(@Param('id') id: string) {
    return this.postService.getByUserId(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 }
    ]),
  )
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
