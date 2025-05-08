// service.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ServiceOutput extends Document {
  @Prop()
  description: string;

  @Prop()
  maxprice: number;

  @Prop()
  minprice: number;

  @Prop({ type: [String], default: [] })
  imageService: string[];

  @Prop()
  specialtyId: string;

  @Prop()
  specialtyName: string;
}

export const ServiceSchema = SchemaFactory.createForClass(ServiceOutput);
