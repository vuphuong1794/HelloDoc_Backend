import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
@Schema({ timestamps: true })
export class News {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Admin' })
    admin: Types.ObjectId; // Người đăng (admin)

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    content: string;

    @Prop({ type: [String], default: [] })
    media?: string[];

    @Prop({ type: Boolean, default: false })
    isHidden: boolean;
}
export const NewsSchema = SchemaFactory.createForClass(News);
