import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userModel' })
    user: Types.ObjectId;

    @Prop({ type: String, required: true, enum: ['User', 'Doctor'] })
    userModel: string;

    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: [String], default: [] })
    media?: string[];

    @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] })
    likes: mongoose.Schema.Types.ObjectId[];

    @Prop({
        type: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                content: { type: String, required: true },
                createdAt: { type: Date, default: Date.now }
            }
        ],
        default: []
    })
    comments: Array<{
        user: mongoose.Types.ObjectId;
        content: string;
        createdAt: Date;
    }>;

}

export const PostSchema = SchemaFactory.createForClass(Post);

