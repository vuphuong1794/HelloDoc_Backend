import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import mongoose, { Document, Types } from 'mongoose';
import { Specialty } from './specialty.schema';
import { IsBoolean, IsUrl } from 'class-validator';
import { ServiceOutput } from './service.schema';
import { IsEmail, IsNotEmpty, IsString, IsArray, ValidateNested, IsNumber } from 'class-validator';

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

  @Prop({ type: [ServiceOutput], default: [] })
  services: ServiceOutput[];  

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

  @Prop({
    type: [
      {
        dayOfWeek: Number,
        hour: Number,
        minute: Number
      }
    ],
    default: []
  })
  workingHours: {
    dayOfWeek: number;
    hour: number;
    minute: number;
  }[];
  
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

  @Prop()
  fcmToken: string;

  @Prop({ default: false })
  @IsBoolean()
  isDeleted: boolean;
}


export const DoctorSchema = SchemaFactory.createForClass(Doctor);
