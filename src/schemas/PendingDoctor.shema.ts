
import { Type } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional, IsUrl } from 'class-validator';
import mongoose, { Document, Types } from 'mongoose';

export enum ExaminationMethod {
  AT_CLINIC = 'at_clinic',
  AT_HOME = 'at_home',
}

@Schema()
export class PendingDoctor extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  CCCD: string;

  @Prop({ required: true })
  license: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  address: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop()
  certificates: string;

  @Prop()
  experience: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true })
  specialty: Types.ObjectId;

  @Prop()
  faceUrl: string;

  @Prop()
  avatarURL: string;

  @Prop()
  @IsUrl()
  licenseUrl: string;

  @Prop()
  backCccdUrl?: string;

  @Prop()
  frontCccdUrl?: string;

  @Prop({ default: false })
  isDeleted: boolean;

}

export const PendingDoctorSchema = SchemaFactory.createForClass(PendingDoctor);
