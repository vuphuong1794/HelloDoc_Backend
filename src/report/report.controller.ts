import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) { }

  @Post()
  async create(@Body() body: {
    reporter: string;
    reporterModel: 'User' | 'Doctor';
    content: string;
    type: 'Bác sĩ' | 'Ứng dụng';
    reportedId: string;
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
    @Body('status') status: 'pending' | 'closed',
  ) {
    return this.reportService.updateStatus(id, status);
  }
}
