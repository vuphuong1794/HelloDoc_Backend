import { PartialType } from '@nestjs/mapped-types';
import { CreateSpecialtyDto } from './create-specialty.dto';
import { Express } from 'express';
import { ObjectId } from 'mongoose';

export class UpdateSpecialtyDto extends PartialType(CreateSpecialtyDto) {
    // Thêm các trường còn thiếu
    image?: Express.Multer.File;
    name?: string;
    description?: string;
    doctors?: ObjectId[]; // Danh sách ID bác sĩ thuộc chuyên khoa (nếu có)
}
