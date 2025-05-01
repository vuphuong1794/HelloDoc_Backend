import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import mongoose, { Document, Types } from 'mongoose';
import { Specialty } from './specialty.schema';
import { IsUrl } from 'class-validator';

@Schema({ timestamps: true })
export class Doctor extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'doctor' })
  role: string;

  @Prop({ default: "" })
  certificates: string;

  @Prop({ type: [{ name: String, price: Number }], default: [] })
  services: { name: string; price: number }[];

  @Prop({ default: 0 })
  patientsCount: number; // Số lượng bệnh nhân đã khám

  @Prop({ default: 0 })
  ratingsCount: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Specialty' })
  specialty: Types.ObjectId | Specialty; // Chuyên khoa

  @Prop()
  @IsUrl()
  faceUrl: string; // Ảnh chân dung

  @Prop()
  @IsUrl()
  licenseUrl: string; // Giấy phép hành nghề

  @Prop({ default: false })
  verified: boolean; // Xác minh tài khoản bác sĩ

  @Prop()
  experience: number; // Số năm kinh nghiệm

  @Prop()
  description: string; // Mô tả chi tiết

  @Prop()
  hospital: string; // Bệnh viện/phòng khám nơi làm việc

  @Prop()
  address: string; // Địa chỉ khám

  @Prop()
  price: number; // Giá khám

  @Prop()
  workingHours: { day: string; slots: string[] }[]; // Lịch khám

  @Prop()
  minAge: number; // Độ tuổi tối thiểu để khám

  @Prop()
  avatarURL: string; // Ảnh đại diện

  @Prop()
  gender?: string; // Nam, Nữ hoặc Khác

  @Prop()
  dob?: Date;

  @Prop()
  cccd?: string;

  @Prop()
  backCccdUrl?: string;

  @Prop()
  frontCccdUrl?: string;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
