
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
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  CCCD: string; // Số CCCD/CMND

  @Prop({ required: true })
  license: string;

  @Prop({ required: true })
  name: string; // Tên bác sĩ

  @Prop({ required: true })
  phone: string; // Số điện thoại

  @Prop({ required: true })
  email: string; // Email

  @Prop({ default: false })
  verified: boolean;

  @Prop()
  certificates: string; // Danh sách chứng chỉ hành nghề

  @Prop()
  experience: number; // Số năm kinh nghiệm

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true })
  specialty: Types.ObjectId;

  @Prop()
  faceUrl: string; // Ảnh chân dung

  @Prop()
  avatarURL: string; // Ảnh đại diện

  @Prop()
  @IsUrl()
  licenseUrl: string; // Giấy phép hành nghề

  @Prop()
  backCccdUrl?: string;

  @Prop()
  frontCccdUrl?: string;

}

export const PendingDoctorSchema = SchemaFactory.createForClass(PendingDoctor);
