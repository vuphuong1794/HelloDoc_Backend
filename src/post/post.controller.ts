import { Query, Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseInterceptors, Req } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from 'src/post/dto/createPost.dto';
import { UpdatePostDto } from 'src/post/dto/updatePost.dto';
import { 
  FilesInterceptor,   
  FileFieldsInterceptor
 } from '@nestjs/platform-express';
import { Request, Express } from 'express';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) { }

  @Post('create')
  @UseInterceptors(FilesInterceptor('images'))
  async createPost(
    @UploadedFiles() 
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createPostDto: CreatePostDto,
  ) {
    if (files && files.length > 0) {
      createPostDto.images = files;
    }
    return this.postService.create(createPostDto);
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
  @UseInterceptors(FilesInterceptor('images'))
  async updatePost(
    @Param('id') id: string,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() updatePostDto: UpdatePostDto,
    @Req() request: Request, // Add this parameter to access the request
  ) {
    // Gán images từ multipart vào DTO
    updatePostDto.images = images;
    console.log(images)
    // Xử lý media (ảnh cũ) từ form-data
    // In NestJS, form-data fields (except files) are available in request.body
    const body = request.body as any; // Type assertion since form-data fields might not be typed
    
    // Handle media array
    if (body.media) {
      // If media is sent as array (media[0], media[1],...)
      if (Array.isArray(body.media)) {
        updatePostDto.media = body.media;
      } 
      // If media is sent as string (single image case)
      else if (typeof body.media === 'string') {
        updatePostDto.media = [body.media];
      }
    }
    
    return this.postService.update(id, updatePostDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.postService.delete(id);
  }
}
