import { IsNotEmpty, IsMongoId, IsIn, IsString, IsArray, IsOptional } from 'class-validator';

export class CreateNotificationDto {
    @IsNotEmpty()
    @IsMongoId()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['User', 'Doctor'])
    userModel: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['ForPost', 'ForAppointment'])
    type: string;

    @IsString()
    content: string;

    @IsString()
    navigatePath: string;
}