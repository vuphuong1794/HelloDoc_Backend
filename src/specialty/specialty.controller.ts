import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { SpecialtyService } from './specialty.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('specialty')
export class SpecialtyController {
  constructor(private readonly specialtyService: SpecialtyService) { }

  @Get('get-all')
  async getSpecialtys() {
    return this.specialtyService.getSpecialties();
  }

  @Post('create')
  @UseInterceptors(FileInterceptor('icon')) // 'icon' là tên field form-data
  async createSpecialty(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createSpecialtyDto: CreateSpecialtyDto,
  ) {
    if (files && files.length > 0) {
      createSpecialtyDto.icon = files;
    }
    return this.specialtyService.create(createSpecialtyDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.specialtyService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSpecialtyDto: UpdateSpecialtyDto,
  ) {
    return this.specialtyService.update(+id, updateSpecialtyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.specialtyService.remove(+id);
  }
}
