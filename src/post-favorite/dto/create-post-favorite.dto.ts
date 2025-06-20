import { IsNotEmpty, IsMongoId, IsIn, IsString, IsArray, IsOptional } from 'class-validator';

export class CreatePostFavoriteDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['user', 'doctor'])
    userModel: string;

    // @IsNotEmpty()
    // @IsMongoId()
    // postId: string;
}