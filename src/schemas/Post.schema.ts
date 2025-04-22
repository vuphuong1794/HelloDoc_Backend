import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Post {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    user: mongoose.Schema.Types.ObjectId;

    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: [String], default: [] })
    media: string[];

    // @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] })
    // likes: mongoose.Schema.Types.ObjectId[];

    // @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Comment', default: [] })
    // comments: mongoose.Schema.Types.ObjectId[];
}

export const PostSchema = SchemaFactory.createForClass(Post);

