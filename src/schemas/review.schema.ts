import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Review extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
    doctor: Types.ObjectId;

    @Prop({ required: true })
    rating: number;

    @Prop({ required: true })
    comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
