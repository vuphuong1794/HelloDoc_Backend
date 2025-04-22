import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreatePostDto {
    @IsString()
    content: string;

    @IsArray()
    @IsOptional()
    media?: string[];

    @IsString()
    userId: string;
}
