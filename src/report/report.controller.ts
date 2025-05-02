import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) { }

  @Post()
  async create(@Body() body: {
    reporter: string;
    reporterModel: 'User' | 'Doctor';
    content: string;
    type: 'Bác sĩ' | 'Ứng dụng' | 'Bài viết';
    reportedId: string;
    postId?: string
  }) {
    return this.reportService.createReport(body);
  }

  @Get()
  async getAll() {
    return this.reportService.getAllReports();
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'opened' | 'closed',
  ) {
    return this.reportService.updateStatus(id, status);
  }

  @Patch(':id/response')
  async updateResponse(
    @Param('id') id: string,
    @Body() body: { responseContent: string; responseTime: string }
  ) {
    return this.reportService.updateResponse(id, body.responseContent, body.responseTime);
  }

  @Delete(':id')
  async deleteReport(@Param('id') id: string) {
    return this.reportService.deleteReport(id);
  }

}
