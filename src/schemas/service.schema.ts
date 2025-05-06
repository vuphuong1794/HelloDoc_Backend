import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import mongoose, { Document, Types } from 'mongoose';
import { Specialty } from './specialty.schema';
import { IsUrl } from 'class-validator';

export class ServiceOutput {
    @Prop()
    _id: string;
  
    @Prop()
    description: string;
  
    @Prop()
    maxprice: number;
  
    @Prop()
    minprice: number;
  
    @Prop({ type: [String], default: [] })
    imageService: string[]; 
    
    @Prop()
    specialtyID: string;
  
    @Prop()
    specialtyName: string;
  }
  