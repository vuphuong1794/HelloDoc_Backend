import { CreateMedicalOptionDto } from './dto/create-medical-option.dto';
import { UpdateMedicalOptionDto } from './dto/update-medical-option.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MedicalOption } from 'src/schemas/medical-option.schema';

@Injectable()
export class MedicalOptionService {
  constructor(
      @InjectModel(MedicalOption.name) private MedicalOptionModel: Model<MedicalOption>,
    ) {}
  async getMedicalOptions() {
    try {
      return await this.MedicalOptionModel.find();
    } catch (error) {
      throw new Error('Đã xảy ra lỗi khi lấy danh sách dịch vụ khám');
    }
  }
  
  create(createMedicalOptionDto: CreateMedicalOptionDto) {
    return 'This action adds a new medicalOption';
  }

  findOne(id: number) {
    return `This action returns a #${id} medicalOption`;
  }

  update(id: number, updateMedicalOptionDto: UpdateMedicalOptionDto) {
    return `This action updates a #${id} medicalOption`;
  }

  remove(id: number) {
    return `This action removes a #${id} medicalOption`;
  }
}
