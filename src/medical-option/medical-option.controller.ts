import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MedicalOptionService } from './medical-option.service';
import { CreateMedicalOptionDto } from './dto/create-medical-option.dto';
import { UpdateMedicalOptionDto } from './dto/update-medical-option.dto';

@Controller('medical-option')
export class MedicalOptionController {
  constructor(private readonly medicalOptionService: MedicalOptionService) {}

  @Get('get-all')
  async getMedicalOptions() {
    return this.medicalOptionService.getMedicalOptions();
  }

  @Post()
  create(@Body() createMedicalOptionDto: CreateMedicalOptionDto) {
    return this.medicalOptionService.create(createMedicalOptionDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicalOptionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMedicalOptionDto: UpdateMedicalOptionDto) {
    return this.medicalOptionService.update(+id, updateMedicalOptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicalOptionService.remove(+id);
  }
}
