import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { News } from './news.schema';
@Schema({ timestamps: true })
export class NewsFavorite {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userModel' })
    user: Types.ObjectId;

    @Prop({ type: String, required: true, enum: ['User', 'Doctor', 'Admin'] })
    userModel: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'News' })
    news: Types.ObjectId | News;
}

export const NewsFavoriteSchema = SchemaFactory.createForClass(NewsFavorite);