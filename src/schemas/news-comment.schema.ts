import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { News } from './news.schema';

@Schema({ timestamps: true })
export class NewsComment extends Document {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userModel' })
    user: Types.ObjectId;

    @Prop({ type: String, required: true, enum: ['User', 'Doctor'] })
    userModel: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'News' })
    news: Types.ObjectId | News;

    @Prop({ required: true })
    content: string;
}

export const NewsCommentSchema = SchemaFactory.createForClass(NewsComment);