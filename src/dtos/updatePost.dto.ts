import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdatePostDto {
    [x: string]: unknown;
    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsArray()
    media?: string[];
}
