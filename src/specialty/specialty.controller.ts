import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Put,
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
    @UploadedFile() file: Express.Multer.File,
    @Body() createSpecialtyDto: CreateSpecialtyDto,
  ) {
    if (file) {
      createSpecialtyDto.image = file;
    }

    return this.specialtyService.create(createSpecialtyDto);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('icon')) // 'icon' là tên field form-data
  async updateSpecialty(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateSpecialtyDto: UpdateSpecialtyDto,
  ) {
    if (file) {
      updateSpecialtyDto.image = file;
    }

    return this.specialtyService.update(id, updateSpecialtyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.specialtyService.remove(id);
  }
}
