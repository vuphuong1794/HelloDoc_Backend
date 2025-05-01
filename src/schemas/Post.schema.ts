import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { IsString, IsEmail, IsBoolean, IsOptional, IsNumber, Min, IsUrl } from 'class-validator';
import { PostComment } from './post-comment.schema';
import { PostFavorite } from './post-favorite.schema';

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

    @IsOptional()
    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PostComment' }] })
    postComment: PostComment[];

    @IsOptional()
    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PostFavorite' }] })
    postFavorite: PostFavorite[];

    // @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] })
    // likes: mongoose.Schema.Types.ObjectId[];

}

export const PostSchema = SchemaFactory.createForClass(Post);

