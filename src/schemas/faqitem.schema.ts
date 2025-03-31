import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({collection: 'faq-items'})
export class FAQItem extends Document {
  @Prop({ required: true })
  question: string;
}

export const FAQItemSchema = SchemaFactory.createForClass(FAQItem);
