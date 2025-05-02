import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report } from 'src/schemas/report.schema';

@Injectable()
export class ReportService {
    constructor(
        @InjectModel(Report.name) private reportModel: Model<Report>,
    ) { }

    async createReport(data: {
        reporter: string;
        reporterModel: 'User' | 'Doctor';
        content: string;
        type: 'Bác sĩ' | 'Ứng dụng' | 'Bài viết';
        reportedId: string;
        postId?: string
    }) {
        return this.reportModel.create({
            reporter: data.reporter,
            reporterModel: data.reporterModel,
            content: data.content,
            type: data.type,
            reportedId: data.reportedId,
            postId: data.postId,
        });
    }

    async getAllReports() {
        return this.reportModel
            .find()
            .populate('reporter')
            .sort({ createdAt: -1 });
    }

    async updateStatus(id: string, status: 'pending' | 'closed') {
        const report = await this.reportModel.findById(id);
        if (!report) throw new NotFoundException('Report not found');
        report.status = status;
        return report.save();
    }

    async updateResponse(id: string, responseContent: string, responseTime: string) {
        const report = await this.reportModel.findById(id);
        if (!report) throw new NotFoundException('Report not found');
        report.responseContent = responseContent;
        report.responseTime = responseTime;
        report.status = 'closed';//đổi trạng thái thành 'closed' sau khi phản hồi
        return report.save();
    }

    async deleteReport(id: string) {
        const report = await this.reportModel.findByIdAndDelete(id);
        if (!report) throw new NotFoundException('Report not found');
        return { message: 'Deleted successfully' };
    }

}
