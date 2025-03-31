import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RemoteMedicalOptionService } from './remote-medical-option.service';
import { CreateRemoteMedicalOptionDto } from './dto/create-remote-medical-option.dto';
import { UpdateRemoteMedicalOptionDto } from './dto/update-remote-medical-option.dto';

@Controller('remote-medical-option')
export class RemoteMedicalOptionController {
  constructor(private readonly remoteMedicalOptionService: RemoteMedicalOptionService) {}

  @Get('get-all')
  async getRemoteMedicalOptions() {
    return this.remoteMedicalOptionService.getRemoteMedicalOptions();
  }

  @Post()
  create(@Body() createRemoteMedicalOptionDto: CreateRemoteMedicalOptionDto) {
    return this.remoteMedicalOptionService.create(createRemoteMedicalOptionDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.remoteMedicalOptionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRemoteMedicalOptionDto: UpdateRemoteMedicalOptionDto) {
    return this.remoteMedicalOptionService.update(+id, updateRemoteMedicalOptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.remoteMedicalOptionService.remove(+id);
  }
}
