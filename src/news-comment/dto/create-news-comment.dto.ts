import { IsNotEmpty, IsMongoId, IsIn, IsString, IsArray, IsOptional } from 'class-validator';
export class CreateNewsCommentDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['User', 'Doctor'])
    userModel: 'User' | 'Doctor';

    @IsString()
    content: string;
}