import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreatePostDto {
    @IsString()
    userId: string;

    @IsString()
    content: string;

    @IsOptional()
    images?: Express.Multer.File[];
}
