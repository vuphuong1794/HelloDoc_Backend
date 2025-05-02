import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  NotFoundException,
  BadRequestException,
  UseGuards,
  Query,
  Put,
  Delete
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { BookAppointmentDto } from 'src/dtos/appointment.dto';
import { JwtAuthGuard } from 'src/Guard/jwt-auth.guard';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) { }

  // API đặt lịch hẹn
  @UseGuards(JwtAuthGuard)
  @Post('book')
  async bookAppointment(@Body() bookData: BookAppointmentDto) {
    try {
      return await this.appointmentService.bookAppointment(bookData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // API hủy lịch hẹn
  @Patch('cancel/:id') //patch: cập nhât một phần
  async cancelAppointment(@Param('id') id: string) {
    try {
      return await this.appointmentService.cancelAppointment(id);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  // API lấy danh sách tất cả lịch hẹn
  @Get('getAll')
  async getAllAppointments() {
    return await this.appointmentService.getAllAppointments();
  }

  @Get(':id')
  async getAppointmentbyitsID(
    @Param('id') id: string
  ) {
    return await this.appointmentService.getAppointmentsbyitsID(id);
  }


  // API xác nhận lịch hẹn
  @Patch('confirm/:id')
  async confirmAppointmentDone(@Param('id') id: string) {
    try {
      return await this.appointmentService.confirmAppointmentDone(id);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  // API lấy danh sách lịch hẹn của bác sĩ (Được đặt)
  @Get('doctor/:doctorID')
  async getDoctorAppointments(@Param('doctorID') doctorID: string) {
    return await this.appointmentService.getDoctorAppointments(doctorID);
  }

  // API lấy danh sách lịch hẹn của bệnh nhân (đã đặt)
  @Get('patient/:patientID')
  async getPatientAppointments(@Param('patientID') patientID: string) {
    return await this.appointmentService.getPatientAppointments(patientID);
  }

  //API lấy danh sách lịch hẹn theo trạng thái
  @Get('/:patientID/by-status')
  async getAppointmentsByStatus(
    @Param('patientID') patientID: string,
    @Query('status') status: string
  ) {
    return await this.appointmentService.getAppointmentsByStatus(patientID, status);
  }

  @Put(':id')
  async updateAppointment(
    @Param('id') id: string,
    @Body() updateData: Partial<BookAppointmentDto>
  ) {
    return await this.appointmentService.updateAppointment(id, updateData);
  }

  @Delete(':id')
  async deleteAppointment(@Param('id') id: string) {
    return await this.appointmentService.deleteAppointment(id);
  }
}