import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FaqitemService } from './faqitem.service';
import { CreateFaqitemDto } from './dto/create-faqitem.dto';
import { UpdateFaqitemDto } from './dto/update-faqitem.dto';

@Controller('faqitem')
export class FaqitemController {
  constructor(private readonly faqitemService: FaqitemService) {}

  @Get('get-all')
  async getFaqitems() {
    return this.faqitemService.getFaqitems();
  }

  @Post()
  create(@Body() createFaqitemDto: CreateFaqitemDto) {
    return this.faqitemService.create(createFaqitemDto);
  }

  @Get()
  findAll() {
    return this.faqitemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.faqitemService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFaqitemDto: UpdateFaqitemDto) {
    return this.faqitemService.update(+id, updateFaqitemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.faqitemService.remove(+id);
  }
}
