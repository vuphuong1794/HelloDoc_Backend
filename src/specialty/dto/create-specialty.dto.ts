import { IsOptional, IsArray, IsMongoId, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';

export class CreateSpecialtyDto {
  @IsString()
  name: string;

  @IsOptional()
  image?: Express.Multer.File;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  doctors: ObjectId[]; // Danh sách ID bác sĩ thuộc chuyên khoa (nếu có)
}
