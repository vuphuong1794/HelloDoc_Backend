import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional, IsUrl } from 'class-validator';
import mongoose, { Document, Types } from 'mongoose';
import { ServiceOutput } from './service.schema';

@Schema({ timestamps: true })
export class Clinic extends Document {
    @IsOptional()
    @Prop({
        type: [
          {
            dayOfWeek: Number,
            hour: Number,
            minute: Number
          }
        ],
        default: []
      })
      workingHours: {
        dayOfWeek: number;
        hour: number;
        minute: number;
      }[];
    
    @IsOptional()
    @Prop()
    description: string; // Mô tả chi tiết
    
    @IsOptional()
    @Prop()
    address: string; // Địa chỉ khám

    @IsOptional()
    @Prop({ type: [ServiceOutput], default: [] })
    services: ServiceOutput[];  
     
}

export const ClinicSchema = SchemaFactory.createForClass(Clinic);