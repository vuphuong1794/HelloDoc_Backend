import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CacheService } from 'src/cache.service';
import { BookAppointmentDto } from 'src/dtos/appointment.dto';
import { Appointment, AppointmentStatus } from 'src/schemas/Appointment.schema';
import { Doctor } from 'src/schemas/doctor.schema';
import { User } from 'src/schemas/user.schema';
import * as admin from 'firebase-admin';

@Injectable()
export class AppointmentService {
    constructor(
        @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
        private cacheService: CacheService,
    ) { }

    // 📌 Đặt lịch hẹn
    async bookAppointment(bookData: BookAppointmentDto) {
        const { doctorID, patientID, patientModel, date, time, status, examinationMethod, reason, notes, totalCost, location } = bookData;

        // Kiểm tra xem bác sĩ có tồn tại không
        const doctor = await this.doctorModel.findById(doctorID);
        if (!doctor) {
            throw new NotFoundException('Doctor not found');
        }

        // Kiểm tra xem cuộc hẹn đã tồn tại chưa (tránh đặt trùng lịch)
        const existingAppointment = await this.appointmentModel.findOne({ doctor: doctorID, date, time });
        if (existingAppointment) {
            throw new BadRequestException('This time slot is already booked');
        }

        //xoa cache lịch hẹn của benh nhan
        const patientCacheKey = 'all_patient_appointments_' + patientID;
        await this.cacheService.deleteCache(patientCacheKey);

        // Tạo cuộc hẹn mới
        const newAppointment = new this.appointmentModel({
            doctor: doctorID,
            patientModel,
            patient: patientID,
            date,
            time,
            status: status || AppointmentStatus.PENDING,
            examinationMethod: examinationMethod || 'at_clinic',
            reason,
            notes,
            totalCost,
            location
        });

        await newAppointment.save();

        await this.notifyDoctor(doctorID, "Bạn có lịch hẹn mới!");

        // 🚩 Xóa cache cũ của bác sĩ
        const doctorCacheKey = 'all_doctor_appointments_' + doctorID;
        await this.cacheService.deleteCache(doctorCacheKey);

        return {
            message: 'Appointment booked successfully',
            appointment: newAppointment,
        };
    }

    // 📌 Gửi thông báo đến bác sĩ

    async notifyDoctor(doctorId: string, message: string) {
        try {
            const doctor = await this.doctorModel.findById(doctorId);
            if (doctor?.fcmToken) {
                await admin.messaging().send({
                    token: doctor.fcmToken,
                    notification: {
                        title: 'Thông báo lịch hẹn mới',
                        body: message,
                    },
                });
                console.log(`Đã gửi thông báo đến bác sĩ ${doctorId}`);
            } else {
                console.warn(`Bác sĩ ${doctorId} không có fcmToken`);
            }
        } catch (error) {
            console.error(`Lỗi khi gửi thông báo đến bác sĩ ${doctorId}:`, error);
        }
    }

    // 📌 Hủy lịch hẹn
    async cancelAppointment(id: string) {
        const appointment = await this.appointmentModel.findById(id);
        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        const patientID = appointment.patient.toString();
        const doctorID = appointment.doctor.toString();

        appointment.status = AppointmentStatus.CANCELLED;

        // Xóa cache bệnh nhân & bác sĩ
        const patientCacheKey = 'all_patient_appointments_' + patientID;
        const doctorCacheKey = 'all_doctor_appointments_' + doctorID;
        await this.cacheService.deleteCache(patientCacheKey);
        await this.cacheService.deleteCache(doctorCacheKey);
        await appointment.save();

        return { message: 'Appointment cancelled successfully' };
    }

    // 📌 Xác nhận lịch hẹn
    async confirmAppointmentDone(id: string) {
        const appointment = await this.appointmentModel.findById(id);
        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        appointment.status = AppointmentStatus.DONE;
        await appointment.save();

        return { message: 'Appointment confirmed done successfully', appointment };
    }

    // 📌 Lấy danh sách tất cả lịch hẹn
    async getAllAppointments() {
        const appointments = await this.appointmentModel.find()
            .populate({
                path: 'doctor',
                select: 'name specialty hospital address',
                populate: {
                    path: 'specialty',
                    select: 'name avatarURL',
                },
            })
            .populate({
                path: 'patient',
                select: '_id name',
                // Mongoose sẽ tự dùng patientModel do bạn đã khai báo refPath
            });

        return appointments;
    }

    // 📌 Lấy danh sách lịch hẹn của bác sĩ
    async getDoctorAppointments(doctorID: string) {
        const doctor = await this.doctorModel.findById(doctorID);
        if (!doctor) {
            throw new NotFoundException('Doctor not found');
        }

        const cacheKey = 'all_doctor_appointments_' + doctorID;
        console.log('Trying to get doctor appointments from cache...');

        const cached = await this.cacheService.getCache(cacheKey);
        if (cached) {
            console.log('Cache doctor appointments HIT');
            return cached;
        }

        console.log('Cache MISS - querying DB');
        const appointments = await this.appointmentModel.find({ doctor: doctorID })
            .populate({
                path: 'doctor',
                select: 'name avatarURL'
            })
            .populate({
                path: 'patient',
                select: 'name',
            });

        if (!appointments) {
            throw new NotFoundException('No appointments found for this doctor');
        }

        console.log('Setting cache...');
        await this.cacheService.setCache(cacheKey, appointments, 3600 * 1000); // Cache for 1 hour

        return appointments;
    }

    // 📌 Lấy danh sách lịch hẹn của bệnh nhân
    async getPatientAppointments(patientID: string) {
        var patient = await this.userModel.findById(patientID);
        if (!patient) {
            patient = await this.doctorModel.findById(patientID);
        }

        const cacheKey = 'all_patient_appointments_' + patientID;
        console.log('Trying to get patient appointments from cache...');

        const cached = await this.cacheService.getCache(cacheKey);
        if (cached) {
            console.log('Cache patient appointments HIT');
            return cached;
        }

        console.log('Cache MISS - querying DB');
        const appointments = await this.appointmentModel.find({ patient: patientID })
            .populate({ path: 'doctor', select: 'name avatarURL' })
            .populate({ path: 'patient', select: 'name' });

        if (!appointments) {
            throw new NotFoundException('No appointments found for this patient');
        }

        console.log('Setting cache...');
        await this.cacheService.setCache(cacheKey, appointments, 3600 * 1000); // Cache for 1 hour

        return appointments;
    }

    // 📌 Lấy danh sách lịch hẹn theo status
    async getAppointmentsByStatus(patientID: string, status: string): Promise<Appointment[]> {
        const appointments = await this.appointmentModel.find({
            patient: patientID,
            status: status,
        }).populate({ path: 'doctor', select: 'name' });
        return appointments;
    }

    async getAppointmentsbyitsID(id: string) {
        const appointment = await this.appointmentModel.findById(id);
        return appointment;
    }

    async updateAppointment(id: string, updateData: Partial<BookAppointmentDto>) {
        const appointment = await this.appointmentModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        const patientID = appointment.patient.toString();
        const doctorID = appointment.doctor.toString();

        const patientCacheKey = 'all_patient_appointments_' + patientID;
        const doctorCacheKey = 'all_doctor_appointments_' + doctorID;
        await this.cacheService.deleteCache(patientCacheKey);
        await this.cacheService.deleteCache(doctorCacheKey);

        return { message: 'Appointment updated successfully', appointment };
    }


    async deleteAppointment(id: string) {
        const appointment = await this.appointmentModel.findById(id);
        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        const patientID = appointment.patient.toString();
        const doctorID = appointment.doctor.toString();

        // Xóa lịch hẹn
        await this.appointmentModel.findByIdAndDelete(id);

        // Xóa cache bệnh nhân & bác sĩ
        const patientCacheKey = 'all_patient_appointments_' + patientID;
        const doctorCacheKey = 'all_doctor_appointments_' + doctorID;
        await this.cacheService.deleteCache(patientCacheKey);
        await this.cacheService.deleteCache(doctorCacheKey);

        return { message: 'Appointment deleted successfully' };
    }
}
