import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { updateUserDto } from 'src/dtos/updateUser.dto';
import { Specialty } from 'src/schemas/specialty.schema';

@Injectable()
export class SpecialtyService {
  constructor(
    @InjectModel(Specialty.name) private SpecialtyModel: Model<Specialty>,
    private cloudinaryService: CloudinaryService,
  ) { }

  async getSpecialties() {
    return await this.SpecialtyModel.find().populate({
      path: 'doctors',
      select: 'name',
    });
  }

  async create(createSpecialtyDto: CreateSpecialtyDto) {
    let uploadedMediaUrl: string = '';

    if (createSpecialtyDto.image) {
      const uploadResult = await this.cloudinaryService.uploadFile(
        createSpecialtyDto.image,
        `Specialty/${createSpecialtyDto.name}/Icon`
      );
      uploadedMediaUrl = uploadResult.secure_url;
    }

    const specialty = await this.SpecialtyModel.create({
      name: createSpecialtyDto.name,
      description: createSpecialtyDto.description,
      icon: uploadedMediaUrl,
      doctors: createSpecialtyDto.doctors,
    });

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
