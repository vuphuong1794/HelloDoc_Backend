import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { IsString, IsEmail, IsBoolean, IsOptional, IsNumber, Min, IsUrl } from 'class-validator';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true })
    @IsString()
    name: string;

    @Prop({ required: true, unique: true })
    @IsEmail()
    email: string;

    @Prop({
        sparse: true,  // Cho phép null/undefined không bị unique constraint
        index: { unique: true, sparse: true }
    })
    @IsString()
    phone: string;

    @Prop()
    @IsString()
    address: string;

    @Prop({ required: false })
    @IsString()
    password: string;

    @Prop({ default: 'User' })
    @IsString()
    role: string;

    @Prop()
    @IsOptional()
    @IsString()
    description?: string;

    @Prop()
    @IsOptional()
    @IsNumber()
    @Min(0)
    minAge?: number;

    @Prop()
    @IsOptional()
    updateAt?: string;

    @Prop()
    @IsOptional()
    createAt?: string;

    @Prop()
    avatarURL: string; // Ảnh đại diện

    @Prop()
    fcmToken: string;

    @Prop({ default: false })
    @IsBoolean()
    isDeleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);