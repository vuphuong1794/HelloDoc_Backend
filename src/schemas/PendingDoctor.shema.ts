
import { Type } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

@Schema()
export class PendingDoctor extends Document {
  @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' ,required: true })
  userId: Types.ObjectId; 

  @Prop({ required: true })
  license: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true })
  specialty: Types.ObjectId; 

  @Prop({ required: true })
  hospital: string;
}

export const PendingDoctorSchema = SchemaFactory.createForClass(PendingDoctor);
