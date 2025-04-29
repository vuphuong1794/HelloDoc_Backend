import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional, IsUrl } from 'class-validator';
import mongoose, { Document, Types } from 'mongoose';

export enum ExaminationMethod {
    AT_CLINIC = 'at_clinic',
    AT_HOME = 'at_home',
}
export class Clinic extends Document {
    @Prop()
    certificates: string[]

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true })
    specialty: Types.ObjectId;

    @Prop()
    @IsOptional()
    @IsUrl()
    anhBiaUrl?: string; // Ảnh bìa

    @Prop()
    address?: string; // Địa chỉ khám

    @Prop({
        required: true,
        enum: ExaminationMethod,
        default: ExaminationMethod.AT_CLINIC,
    })
    examinationMethod: ExaminationMethod;

    @Prop()
    minPrice?: number; // Giá khám

    @Prop()
    maxPrice?: number; // Giá khám

    @Prop()
    description?: string; // thôn tin giới thiệu

    @Prop()
    workingHours?: { day: string; slots: string[] }[]; // Lịch khám
}

export const ClinicSchema = SchemaFactory.createForClass(Clinic);