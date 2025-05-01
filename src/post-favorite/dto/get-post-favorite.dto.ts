import { IsNotEmpty, IsMongoId, IsIn, IsString, IsArray, IsOptional } from 'class-validator';

export class GetPostFavoriteDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string;

    // @IsNotEmpty()
    // @IsMongoId()
    // postId: string;
}