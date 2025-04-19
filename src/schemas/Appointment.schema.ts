import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types, Document } from 'mongoose';

export enum AppointmentStatus {
  PENDING = 'pending',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum ExaminationMethod {
  AT_CLINIC = 'at_clinic',
  AT_HOME = 'at_home',
}

@Schema({ timestamps: true })
export class Appointment extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true })
  doctor: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  patient: Types.ObjectId;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  time: string;

  @Prop({
    required: true,
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  }) // Dùng enum
  status: AppointmentStatus;

  @Prop({
    required: true,
    enum: ExaminationMethod,
    default: ExaminationMethod.AT_CLINIC,
  })
  examinationMethod: ExaminationMethod;

  @Prop()
  reason?: string;

  @Prop()
  notes?: string;

  @Prop()
  totalCost: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
