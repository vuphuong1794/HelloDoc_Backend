import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PostFavoriteService } from './post-favorite.service';
import { CreatePostFavoriteDto } from './dto/create-post-favorite.dto';
import { UpdatePostFavoriteDto } from './dto/update-post-favorite.dto';

@Controller('post-favorite')
export class PostFavoriteController {
  constructor(private readonly postFavoriteService: PostFavoriteService) {}

  @Post('create')
  create(@Body() createPostFavoriteDto: CreatePostFavoriteDto) {
    return this.postFavoriteService.create(createPostFavoriteDto);
  }

  @Get()
  findAll() {
    return this.postFavoriteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postFavoriteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostFavoriteDto: UpdatePostFavoriteDto) {
    return this.postFavoriteService.update(+id, updatePostFavoriteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postFavoriteService.remove(+id);
  }
}
