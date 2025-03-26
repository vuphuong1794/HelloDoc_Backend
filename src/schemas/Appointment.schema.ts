import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types, Document } from "mongoose";

export enum AppointmentStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

@Schema({ timestamps: true })
export class Appointment extends Document {
  @Prop({ type: Types.ObjectId, ref: "Doctor", required: true }) // Sửa đúng tham chiếu
  doctor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true }) // Sửa đúng tham chiếu
  patient: Types.ObjectId;

  @Prop({ type: Date, required: true }) // Chuyển sang Date để dễ xử lý
  date: Date;

  @Prop({ required: true }) // Giữ nguyên string nếu chỉ lưu HH:mm
  time: string;

  @Prop({ required: true, enum: AppointmentStatus, default: AppointmentStatus.PENDING }) // Dùng enum
  status: AppointmentStatus;

  @Prop()
  reason?: string;

  @Prop()
  notes?: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
