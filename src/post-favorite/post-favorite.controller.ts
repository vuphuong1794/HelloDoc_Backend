import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PostFavoriteService } from './post-favorite.service';
import { CreatePostFavoriteDto } from './dto/create-post-favorite.dto';
import { GetPostFavoriteDto } from './dto/get-post-favorite.dto';

@Controller('post')
export class PostFavoriteController {
  constructor(private readonly postFavoriteService: PostFavoriteService) { }

  @Get(':postId/favorite/get')
  async getPostFavoritesByPostId(@Param('postId') postId: string, @Query() getPostFavoriteDto: GetPostFavoriteDto) {
    return this.postFavoriteService.getPostFavoritesByPostId(postId, getPostFavoriteDto);
  }

  @Post(':postId/favorite/update')
  async updatePostFavoriteByPostId(@Param('postId') postId: string, @Body() createPostFavoriteDto: CreatePostFavoriteDto) {
    if (!createPostFavoriteDto.userId) {
      throw new Error('userId is required');
    }
    console.log('Updating post favorite for postId:', postId, 'with userId:', createPostFavoriteDto.userId);
    return this.postFavoriteService.updatePostFavoriteByPostId(postId, createPostFavoriteDto);
  }

  @Get('user/:userId/favorite/get')
  async getPostFavoritesByUserId(@Param('userId') userId: string) {
    return this.postFavoriteService.getPostFavoritesByUserId(userId);
  }
}
