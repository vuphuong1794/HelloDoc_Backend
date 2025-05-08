import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { Post } from './Post.schema';

@Schema({ timestamps: true })
export class Notification extends Document {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userModel' })
    user: Types.ObjectId;

    @Prop({ type: String, required: true, enum: ['User', 'Doctor'] })
    userModel: string;

    @Prop({ type: String, required: true, enum: ['ForPost', 'ForAppointment'] })
    type: string;

    @Prop({ required: true })
    content: string;

    @Prop({ required: false })
    navigatePath: string;

    @Prop({ default: false })
    isRead: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
