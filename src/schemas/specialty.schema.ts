import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({collection: 'specialties'})
export class Specialty extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  icon: string;
}

export const SpecialtySchema = SchemaFactory.createForClass(Specialty);
