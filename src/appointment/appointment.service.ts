import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BookAppointmentDto } from 'src/dtos/appointment.dto';
import { Appointment, AppointmentStatus } from 'src/schemas/Appointment.schema';

import { Doctor } from 'src/schemas/doctor.schema';
import { User } from 'src/schemas/user.schema';

@Injectable()
export class AppointmentService {
    constructor(
        @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Doctor.name) private doctorModel: Model<Doctor>
    ) {}

    // 📌 Đặt lịch hẹn
    async bookAppointment(bookData: BookAppointmentDto) {
        const { doctorID, patientID, date, time, status, reason, notes } = bookData;

        // Kiểm tra xem bác sĩ có tồn tại không
        const doctor = await this.doctorModel.findById(doctorID);
        if (!doctor) {
            throw new NotFoundException('Doctor not found');
        }

        // Kiểm tra xem bệnh nhân có tồn tại không
        let patient = await this.userModel.findById(patientID);
        if (!patient) {
            patient = await this.doctorModel.findById(patientID);
        }
        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        // Kiểm tra xem cuộc hẹn đã tồn tại chưa (tránh đặt trùng lịch)
        const existingAppointment = await this.appointmentModel.findOne({ doctor: doctorID, date, time });
        if (existingAppointment) {
            throw new BadRequestException('This time slot is already booked');
        }

        // Tạo cuộc hẹn mới
        const newAppointment = new this.appointmentModel({
            doctor: doctorID,
            patient: patientID,
            date,
            time,
            status: status || AppointmentStatus.PENDING, // Mặc định là "pending"
            reason,
            notes,
        });

        await newAppointment.save();

        return {
            message: 'Appointment booked successfully',
            appointment: newAppointment,
        };
    }

    // 📌 Hủy lịch hẹn
    async cancelAppointment(id: string) {
        const appointment = await this.appointmentModel.findById(id);
        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        appointment.status = AppointmentStatus.CANCELLED;
        await appointment.save();

        return { message: 'Appointment cancelled successfully', appointment };
    }

    // 📌 Xác nhận lịch hẹn
    async confirmAppointment(id: string) {
        const appointment = await this.appointmentModel.findById(id);
        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        appointment.status = AppointmentStatus.CONFIRMED;
        await appointment.save();

        return { message: 'Appointment confirmed successfully', appointment };
    }

    // 📌 Lấy danh sách tất cả lịch hẹn
    async getAllAppointments() {
    const appointments = await this.appointmentModel.find()
        .populate({
          path: 'doctor',
          select: 'name specialty hospital address',
          populate: {
            path: 'specialty',
            select: 'name', 
          },
        })
        .populate({
          path: 'patient',
          select: 'name',
        });
      return appointments;
    }

    // 📌 Lấy danh sách lịch hẹn của bác sĩ
    async getDoctorAppointments(doctorID: string) {
        const doctor = await this.doctorModel.findById(doctorID);
        if (!doctor) {
            throw new NotFoundException('Doctor not found');
        }

        const appointments = await this.appointmentModel.find({ doctor: doctorID }).populate({
            path: 'patient',
            select: 'name',
          });

        if (!appointments) {
            throw new NotFoundException('No appointments found for this doctor');
        }

        return appointments ;
    }

    // 📌 Lấy danh sách lịch hẹn của bệnh nhân
    async getPatientAppointments(patientID: string) {
        const patient = await this.userModel.findById(patientID);
        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        const appointments = await this.appointmentModel.find({ patient: patientID }).populate({ path: 'doctor', select: 'name' })

        if (!appointments) {
            throw new NotFoundException('No appointments found for this patient');
        }
        return appointments;
    }
}
