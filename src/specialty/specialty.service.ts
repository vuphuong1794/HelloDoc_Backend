import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
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

    const uploadedMediaUrls: string[] = [];
    if (createSpecialtyDto.icon && createSpecialtyDto.icon.length > 0) {
      for (const file of createSpecialtyDto.icon) {
        try {
          const uploadResult = await this.cloudinaryService.uploadFile(
            file,
            `Specialty/${createSpecialtyDto.name}`,
          );
          uploadedMediaUrls.push(uploadResult.secure_url);
          console.log('Ảnh đã tải lên Cloudinary:', uploadResult.secure_url);
        } catch (error) {
          console.error('Lỗi Cloudinary khi upload media:', error);
          throw new BadRequestException('Lỗi khi tải media lên Cloudinary');
        }
      }
    }

    const specialty = await this.SpecialtyModel.create({
      name: createSpecialtyDto.name,
      description: createSpecialtyDto.description,
      icon: uploadedMediaUrls,
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
