
import { Type } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional, IsUrl } from 'class-validator';
import mongoose, { Document, Types } from 'mongoose';

export enum ExaminationMethod {
  AT_CLINIC = 'at_clinic',
  AT_HOME = 'at_home',
}

@Schema()
export class PendingDoctor extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  CCCD: string; // Số CCCD/CMND

  @Prop({ required: true })
  license: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true })
  specialty: Types.ObjectId;

  @Prop({ required: true })
  @IsUrl()
  faceUrl: string; // Ảnh xét duyệt

  @Prop()
  @IsUrl()
  licenseUrl: string; // Giấy phép hành nghề

  @Prop({ required: true })
  backCccdUrl: string;

  @Prop({ required: true })
  frontCccdUrl: string;

  @Prop()
  @IsOptional()
  @IsUrl()
  anhBiaUrl: string; // Ảnh bìa

  @Prop()
  address: string; // Địa chỉ khám

  @Prop({
    required: true,
    enum: ExaminationMethod,
    default: ExaminationMethod.AT_CLINIC,
  })
  examinationMethod: ExaminationMethod;

  @Prop()
  minPrice: number; // Giá khám

  @Prop()
  maxPrice: number; // Giá khám

  @Prop()
  description: string; // thôn tin giới thiệu

  @Prop()
  workingHours: { day: string; slots: string[] }[]; // Lịch khám
}

export const PendingDoctorSchema = SchemaFactory.createForClass(PendingDoctor);
