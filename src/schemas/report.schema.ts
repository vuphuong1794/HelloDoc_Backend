import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Report extends Document {
    @Prop({ required: true, type: Types.ObjectId, refPath: 'reporterModel' })
    reporter: Types.ObjectId;

    @Prop({ required: true, enum: ['User', 'Doctor'] })
    reporterModel: string; // phân biệt User hay Doctor

    @Prop({ required: true })
    content: string;

    @Prop({ required: true, enum: ['Bác sĩ', 'Ứng dụng', 'Bài viết'] })
    type: string; // Loại báo cáo

    @Prop({ default: 'pending', enum: ['pending', 'closed'] })
    status: string;

    @Prop({ required: true })
    reportedId: string;

    @Prop()
    postId?: string; // báo cáo bài viết mới có

}

export const ReportSchema = SchemaFactory.createForClass(Report);
