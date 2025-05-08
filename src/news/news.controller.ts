import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/createNews.dto';
import { UpdateNewsDto } from './dto/updateNews.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) { }

  @Post('create')
  @UseInterceptors(FilesInterceptor('images'))
  async create(@UploadedFiles() files: Express.Multer.File[], @Body() dto: CreateNewsDto) {
    if (files && files.length > 0) dto.images = files;
    return this.newsService.create(dto);
  }

  @Get()
  async getAll() {
    return this.newsService.getAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.newsService.getOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  async update(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[], @Body() dto: UpdateNewsDto) {
    dto.images = files;
    return this.newsService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.newsService.delete(id);
  }
}
