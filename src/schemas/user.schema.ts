import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { IsString, IsEmail, IsBoolean, IsOptional, IsArray, IsNumber, Min, Max, IsUrl, IsMongoId } from 'class-validator';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true })
    @IsString()
    name: string;

    @Prop({ required: true, unique: true })
    @IsEmail()
    email: string;

    @Prop({ required: true, unique: true })
    @IsString()
    phone: string;

    @Prop({ required: true })
    @IsString()
    password: string;

    @Prop({ default: 'user' })
    @IsString()
    role: string;

    @Prop({ default: false })
    @IsBoolean()
    isDoctor: boolean;

    @Prop()
    @IsOptional()
    @IsString()
    license?: string;

    @Prop({ default: false })
    @IsBoolean()
    verified: boolean;

    @Prop()
    @IsOptional()
    @IsString()
    specialty?: string;

    @Prop()
    @IsOptional()
    @IsNumber()
    @Min(0)
    experience?: number;

    @Prop()
    @IsOptional()
    @IsString()
    description?: string;

    @Prop()
    @IsOptional()
    @IsString()
    hospital?: string;

    @Prop()
    @IsOptional()
    @IsString()
    address?: string;

    @Prop()
    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @Prop()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    insurance?: string[];

    @Prop()
    @IsOptional()
    workingHours?: { day: string; slots: string[] }[];

    @Prop()
    @IsOptional()
    @IsNumber()
    @Min(0)
    minAge?: number;

    @Prop()
    @IsOptional()
    @IsUrl()
    userImage?: string;

}

export const UserSchema = SchemaFactory.createForClass(User);
