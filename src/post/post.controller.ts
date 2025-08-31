// src/post/post.controller.ts - DEBUG VERSION
import { Query, Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseInterceptors, Req } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from 'src/post/dto/createPost.dto';
import { UpdatePostDto } from 'src/post/dto/updatePost.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request, Express } from 'express';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) { }

  @Post('create')
  @UseInterceptors(FilesInterceptor('images'))
  async createPost(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createPostDto: CreatePostDto,
  ) {
    console.log(`=== POST CREATION REQUEST ===`);
    console.log(`Files:`, files?.length || 0);
    console.log(`DTO:`, JSON.stringify(createPostDto, null, 2));

    if (files && files.length > 0) {
      createPostDto.images = files;
    }

    const result = await this.postService.create(createPostDto);
    console.log(`=== POST CREATION RESPONSE ===`);
    console.log(`Created post ID: ${result._id}`);
    return result;
  }

  // Debug endpoint to create minimal post
  @Post('debug/create-minimal')
  async createMinimalPost(@Body() body: { content: string; userId: string }) {
    console.log(`=== CREATING MINIMAL POST FOR DEBUG ===`);
    return this.postService.forceCreateMinimalPost(body.content, body.userId);
  }

  @Get()
  async getAll(
    @Query('limit') limit = '10',
    @Query('skip') skip = '0'
  ) {
    const limitNum = parseInt(limit);
    const skipNum = parseInt(skip);
    console.log(`=== GET ALL POSTS REQUEST ===`);
    console.log(`Limit: ${limitNum}, Skip: ${skipNum}`);

    const result = await this.postService.getAll(limitNum, skipNum);
    console.log(`=== GET ALL POSTS RESPONSE ===`);
    console.log(`Found ${result.posts.length} posts, Total: ${result.total}`);
    return result;
  }

  @Get('debug/tracking')
  async getTrackingInfo() {
    return this.postService.getTrackingInfo();
  }

  @Get('debug/check/:id')
  async checkPost(@Param('id') id: string) {
    console.log(`=== CHECKING POST ${id} ===`);
    const result = await this.postService.checkPostExists(id);
    console.log(`Check result:`, result);
    return result;
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    console.log(`=== GET SINGLE POST ${id} ===`);
    return this.postService.getOne(id);
  }

  @Get('get-by-user-id/:id')
  async getByUserId(@Param('id') id: string) {
    console.log(`=== GET POSTS BY USER ${id} ===`);
    return this.postService.getByUserId(id);
  }

  // Temporarily disable update/delete to isolate the issue
  @Patch(':id')
  async updatePost(@Param('id') id: string) {
    return { message: 'Update disabled for debugging' };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return { message: 'Delete disabled for debugging' };
  }

  @Get('search')
  async searchPost(@Query('q') query: string) {
    return { message: 'Search disabled for debugging', results: [] };
  }
}