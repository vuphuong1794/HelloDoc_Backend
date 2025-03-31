
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class PendingDoctor extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  license: string;

  @Prop({ default: false })
  verified: boolean;
}

export const PendingDoctorSchema = SchemaFactory.createForClass(PendingDoctor);
