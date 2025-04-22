import { Body, Controller, Delete, Get, Param, Patch, Post as HttpPost } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from 'src/dtos/createPost.dto';
import { UpdatePostDto } from 'src/dtos/updatePost.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) { }

  @HttpPost()
  async create(@Body() createPostDto: CreatePostDto) {
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

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(id, updatePostDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.postService.delete(id);
  }
}
