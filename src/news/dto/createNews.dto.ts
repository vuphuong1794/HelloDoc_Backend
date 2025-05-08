import { IsNotEmpty, IsMongoId, IsIn, IsString, IsArray, IsOptional } from 'class-validator';

export class CreateNewsDto {
    @IsNotEmpty()
    @IsMongoId()
    adminId: string;

    @IsString()
    title: string;

    @IsString()
    content: string;

    @IsOptional()
    images?: Express.Multer.File[];
}