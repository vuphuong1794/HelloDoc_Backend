import { IsEmail, IsMongoId, IsNumber, IsString } from "class-validator";

export class applyDoctorDto {
    @IsString()
    CCCD: string;

    @IsString()
    license: string;

    @IsMongoId()
    specialty: string;

    @IsString()
    address: string;

    @IsString()
    examinationMethod: string;

    @IsNumber()
    minPrice: number;

    @IsNumber()
    maxPrice: number;

    @IsString()
    description: string;

    @IsString()
    workingHours: string;


}