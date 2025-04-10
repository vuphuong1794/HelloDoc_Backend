import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, mongo, Types } from 'mongoose';
import { Doctor } from './doctor.schema';

@Schema({ collection: 'specialties' })
export class Specialty extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  icon: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }] })
  doctors: Doctor[]; // Danh sách bác sĩ thuộc chuyên khoa
}

export const SpecialtySchema = SchemaFactory.createForClass(Specialty);
