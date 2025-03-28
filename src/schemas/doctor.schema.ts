import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

  @Prop()
  specialty: string; // Chuyên khoa

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
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
