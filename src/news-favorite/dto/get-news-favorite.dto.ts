import { IsNotEmpty, IsMongoId, IsIn, IsString, IsArray, IsOptional } from 'class-validator';

export class GetNewsFavoriteDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string;
}