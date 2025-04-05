import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Specialty } from 'src/schemas/specialty.schema';

@Injectable()
export class SpecialtyService {
  constructor(
    @InjectModel(Specialty.name) private SpecialtyModel: Model<Specialty>,
  ) {}
  async getSpecialtys() {
    return await this.SpecialtyModel.find();
  }

  async create(createSpecialtyDto: CreateSpecialtyDto) {
    const specialty = await this.SpecialtyModel.create(createSpecialtyDto);
    if (!specialty) {
      throw new BadRequestException('Tạo chuyên khoa không thành công');
    }
    return specialty;
  }
  findOne(id: number) {
    return `This action returns a #${id} specialty`;
  }

  update(id: number, updateSpecialtyDto: UpdateSpecialtyDto) {
    return `This action updates a #${id} specialty`;
  }

  remove(id: number) {
    return `This action removes a #${id} specialty`;
  }
}
