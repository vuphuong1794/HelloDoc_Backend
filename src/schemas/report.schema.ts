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

    @Prop({ required: true, enum: ['Người dùng', 'Ứng dụng', 'Bài viết'] })
    type: string; // Loại báo cáo

    @Prop({ default: 'opened', enum: ['opened', 'closed'] })
    status: string;

    @Prop({ required: true })
    reportedId: string;

    @Prop()
    postId?: string; // báo cáo bài viết mới có

    @Prop()
    responseContent?: string;// nội dung phản hồi từ admin

    @Prop()
    responseTime?: string;// thời gian phản hồi

}

export const ReportSchema = SchemaFactory.createForClass(Report);
