import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Doctor } from './doctor.schema';

@Schema({ collection: 'specialties' })
export class Specialty extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  icon: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Doctor' }] })
  doctors: Types.ObjectId[] | Doctor[]; // Danh sách bác sĩ thuộc chuyên khoa
}

export const SpecialtySchema = SchemaFactory.createForClass(Specialty);
