import { IsEmail, IsMongoId, IsNumber, IsOptional, IsString } from "class-validator";

export class applyDoctorDto {
    @IsString()
    CCCD: string;

    @IsString()
    license: string;

    @IsMongoId()
    specialty: string;

    @IsOptional()
    licenseUrl?: Express.Multer.File;

    @IsOptional()
    faceUrl?: Express.Multer.File;

    @IsOptional()
    frontCccdUrl?: Express.Multer.File;

    @IsOptional()
    backCccdUrl?: Express.Multer.File;
}