import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({collection: 'remote-medical-options'})
export class RemoteMedicalOption extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  icon: string;
}

export const RemoteMedicalOptionSchema = SchemaFactory.createForClass(RemoteMedicalOption);
