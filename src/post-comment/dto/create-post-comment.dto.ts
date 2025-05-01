import { IsNotEmpty, IsMongoId, IsIn, IsString, IsArray, IsOptional } from 'class-validator';

export class CreatePostCommentDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['User', 'Doctor'])
    userModel: string;

    // @IsNotEmpty()
    // @IsMongoId()
    // postId: string;

    @IsString()
    content: string;
}