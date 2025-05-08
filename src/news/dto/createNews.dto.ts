import { IsNotEmpty, IsMongoId, IsIn, IsString, IsArray, IsOptional } from 'class-validator';
import { Express } from 'express';

export class CreateNewsDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['User', 'Doctor'])
    userModel: 'User' | 'Doctor';

    @IsString()
    title: string;

    @IsString()
    content: string;

    @IsOptional()
    images?: Express.Multer.File[];
}