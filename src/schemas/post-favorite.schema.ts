import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { Post } from './Post.schema';

@Schema({ timestamps: true })
export class PostFavorite extends Document {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userModel' })
    user: Types.ObjectId;

    @Prop({ type: String, required: true, enum: ['user', 'doctor'] })
    userModel: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Post' })
    post: Types.ObjectId | Post;
}

export const PostFavoriteSchema = SchemaFactory.createForClass(PostFavorite);
