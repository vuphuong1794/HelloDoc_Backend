import { IsOptional, IsArray, IsMongoId, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';

export class CreateSpecialtyDto {
  @IsString()
  name: string;

  @IsOptional()
  icon?: Express.Multer.File[]; // Đường dẫn đến biểu tượng của chuyên khoa

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  doctors: ObjectId[]; // Danh sách ID bác sĩ thuộc chuyên khoa (nếu có)
}
