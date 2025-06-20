import { IsEmail, IsOptional, IsNumberString, IsString, Matches, MinLength } from "class-validator";

export class LoginGoogleDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    phone: string;

    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    licenseUrl: string;
}