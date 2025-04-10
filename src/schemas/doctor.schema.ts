import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import mongoose, { Document, Types } from 'mongoose';
import { Specialty } from './specialty.schema';

@Schema()
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

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Specialty' })
  specialty: Types.ObjectId | Specialty; // Chuyên khoa

  @Prop()
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
  insurance: string[]; // Các loại bảo hiểm áp dụng

  @Prop()
  workingHours: { day: string; slots: string[] }[]; // Lịch khám

  @Prop()
  minAge: number; // Độ tuổi tối thiểu để khám

  @Prop()
  imageUrl: string; // Ảnh bác sĩ

  @Prop()
  gender?: string; // Nam, Nữ hoặc Khác

  @Prop()
  dob?: Date;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
