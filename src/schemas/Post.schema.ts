import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { IsString, IsEmail, IsBoolean, IsOptional, IsNumber, Min, IsUrl } from 'class-validator';
import { PostComment } from './post-comment.schema';
import { PostFavorite } from './post-favorite.schema';

@Schema({ timestamps: true})
export class Post {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userModel' })
    user: Types.ObjectId;

    @Prop({ type: String, required: true, enum: ['User', 'Doctor'] })
    userModel: string;

    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: [String], default: [] })
    media?: string[];

    // @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] })
    // likes: mongoose.Schema.Types.ObjectId[];

    @Prop({ type: Boolean, default: false })
    isHidden: boolean;

    @Prop({ type: String, default: '' })
    keywords: string;

    @Prop({ type: String, default: '' })
    specialtyNormalized?: string;

}

export const PostSchema = SchemaFactory.createForClass(Post);

