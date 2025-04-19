import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types, Document } from 'mongoose';

export enum AppointmentStatus {
  PENDING = 'pending',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum ConsultationMethod {
  IN_PERSON = 'in_person',
  ONLINE = 'online',
}

@Schema({ timestamps: true })
export class Appointment extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true })
  doctor: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  patient: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date;

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
    enum: ConsultationMethod,
    default: ConsultationMethod.IN_PERSON,
  })
  consultationMethod: ConsultationMethod;

  @Prop()
  reason?: string;

  @Prop()
  notes?: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
