import { IsEmail, IsMongoId, IsNumber, IsString } from "class-validator";

export class applyDoctorDto {
    @IsString()
    CCCD: string;

    @IsString()
    license: string;

    @IsMongoId()
    specialty: string;
}