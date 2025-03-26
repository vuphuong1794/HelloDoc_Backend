import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { BookAppointmentDto } from 'src/dtos/appointment.dto';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  // API đặt lịch hẹn
  @Post('book')
  async bookAppointment(@Body() bookData: BookAppointmentDto) {
    try {
      return await this.appointmentService.bookAppointment(bookData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // API hủy lịch hẹn
  @Patch('cancel/:id')
  async cancelAppointment(@Param('id') id: string) {
    try {
      return await this.appointmentService.cancelAppointment(id);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  // API xác nhận lịch hẹn
  @Patch('confirm/:id')
  async confirmAppointment(@Param('id') id: string) {
    try {
      return await this.appointmentService.confirmAppointment(id);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  // API lấy danh sách lịch hẹn của bác sĩ
  @Get('doctor/:doctorID')
  async getDoctorAppointments(@Param('doctorID') doctorID: string) {
    return await this.appointmentService.getDoctorAppointments(doctorID);
  }

  // API lấy danh sách lịch hẹn của bệnh nhân
  @Get('patient/:patientID')
  async getPatientAppointments(@Param('patientID') patientID: string) {
    return await this.appointmentService.getPatientAppointments(patientID);
  }
}
