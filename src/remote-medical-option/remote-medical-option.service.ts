import { CreateRemoteMedicalOptionDto } from './dto/create-remote-medical-option.dto';
import { UpdateRemoteMedicalOptionDto } from './dto/update-remote-medical-option.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RemoteMedicalOption } from 'src/schemas/remote-medical-option.schema';

@Injectable()
export class RemoteMedicalOptionService {
  constructor(
        @InjectModel(RemoteMedicalOption.name) private RemoteMedicalOptionModel: Model<RemoteMedicalOption>,
      ) {}
      async getRemoteMedicalOptions() {
        return await this.RemoteMedicalOptionModel.find();
      }
  create(createRemoteMedicalOptionDto: CreateRemoteMedicalOptionDto) {
    return 'This action adds a new remoteMedicalOption';
  }

  findOne(id: number) {
    return `This action returns a #${id} remoteMedicalOption`;
  }

  update(id: number, updateRemoteMedicalOptionDto: UpdateRemoteMedicalOptionDto) {
    return `This action updates a #${id} remoteMedicalOption`;
  }

  remove(id: number) {
    return `This action removes a #${id} remoteMedicalOption`;
  }
}
