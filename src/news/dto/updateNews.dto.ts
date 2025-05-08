import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsArray, IsMongoId, IsOptional } from 'class-validator';

export class UpdateNewsDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsArray()
    media?: string[];

    @IsOptional()
    @Type(() => Object)
    images?: Express.Multer.File[];
}
