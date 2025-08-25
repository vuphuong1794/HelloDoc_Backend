import {
  BadRequestException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { SignupDto } from 'src/dtos/signup.dto';
import { Doctor } from 'src/schemas/doctor.schema';
import { loginDto } from 'src/dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/schemas/user.schema';
import { PendingDoctor } from 'src/schemas/PendingDoctor.shema';
import { Specialty } from 'src/schemas/specialty.schema';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CacheService } from 'src/cache.service';
import { Clinic } from 'src/schemas/clinic.schema';
import { Express } from 'express';
import { Appointment, AppointmentStatus } from 'src/schemas/Appointment.schema';

@Injectable()
export class DoctorService {
  constructor(
    @InjectModel(Doctor.name) private DoctorModel: Model<Doctor>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(PendingDoctor.name) private pendingDoctorModel: Model<PendingDoctor>,
    @InjectModel(Specialty.name) private SpecialtyModel: Model<Specialty>,
    @InjectModel(Appointment.name) private AppointmentModel: Model<Appointment>,
    private jwtService: JwtService,
    private cloudinaryService: CloudinaryService,
    private cacheService: CacheService,
  ) { }

  async getDoctors() {
    const cacheKey = 'all_doctors';
    console.log('Trying to get doctors from cache...');

    const cached = await this.cacheService.getCache(cacheKey);
    if (cached) {
      console.log('Cache doctor HIT');
      return cached;
    }

    console.log('Cache MISS - querying DB');
    const data = await this.DoctorModel.find().populate('specialty').lean();

    console.log('Setting cache...');
    await this.cacheService.setCache(cacheKey, data, 30 * 1000);
    return data;
  }

  async registerDoctor(signUpData: SignupDto) {
    const { email, password, name, phone, licenseUrl } = signUpData;
    const emailInUse = await this.DoctorModel.findOne({ email });
    if (emailInUse) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    if (!licenseUrl) {
      throw new BadRequestException('Cần tải giấy phép hành nghề');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.DoctorModel.create({
      email,
      password: hashedPassword,
      name,
      phone,
      licenseUrl,
    });
    return {
      message: 'Đăng ký bác sĩ thành công, vui lòng chờ xác thực từ admin',
    };
  }

  async loginDoctor(loginData: loginDto) {
    const { email, password } = loginData;
    const doctor = await this.DoctorModel.findOne({ email });
    if (!doctor) {
      throw new BadRequestException('Bác sĩ không tồn tại');
    }
    const passwordMatches = await bcrypt.compare(password, doctor.password);
    if (!passwordMatches) {
      throw new BadRequestException('Mật khẩu không đúng');
    }

    if (!doctor.verified) {
      throw new BadRequestException('Tài khoản chưa được xác minh');
    }

    return this.generateDoctorTokens(
      doctor._id,
      doctor.email,
      doctor.name,
      doctor.role,
    );
  }

  async generateDoctorTokens(doctorId, email, name, role) {
    const accessToken = this.jwtService.sign(
      { doctorId, email, name, role },
      { expiresIn: '1d' },
    );
    return {
      accessToken,
    };
  }

  async updateClinic(
    doctorId: string,
    updateData: any,
    files?: { serviceImage?: Express.Multer.File[] }
  ) {
    if (!Types.ObjectId.isValid(doctorId)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const doctor = await this.DoctorModel.findById(doctorId);
    if (!doctor) {
      throw new BadRequestException('Bác sĩ không tồn tại');
    }

    // Parse & filter dữ liệu đầu vào
    const filteredData = this.filterAllowedFields(updateData);
    const uploadedImages = await this.uploadServiceImages(files?.serviceImage, doctorId);

    // Xử lý services nếu có
    if (Array.isArray(filteredData.services)) {
      filteredData.services = await this.mergeServices(doctorId, filteredData.oldService, filteredData.services, uploadedImages);
    }

    // Xử lý workingHours nếu có
    if (Array.isArray(filteredData.workingHours)) {
      filteredData.workingHours = this.mergeWorkingHours(filteredData.oldWorkingHours, filteredData.workingHours);
    }

    // Gán và lưu
    await Object.assign(doctor, filteredData);
    await doctor.save();
    await this.cacheService.deleteCache(`doctor_${doctorId}`);

    return {
      message: 'Cập nhật thông tin phòng khám thành công',
      data: doctor,
    };
  }

  private filterAllowedFields(data: any) {
    const allowed = ['description', 'address', 'services', 'workingHours', 'oldService', 'oldWorkingHours', 'hasHomeService', 'isClinicPaused'];
    const filtered: any = {};
    for (const key of allowed) {
      if (key in data) {
        if (key === 'hasHomeService' || key === 'isClinicPaused') {
          // Chuyển đổi sang boolean nếu là chuỗi
          filtered[key] = data[key] === 'true' || data[key] === true;
        } else {
          filtered[key] = data[key];
        }
      }
    }
    return filtered;
  }

  private async uploadServiceImages(files: Express.Multer.File[] = [], doctorId: string): Promise<string[]> {
    const uploaded: string[] = [];

    for (const file of files) {
      const result = await this.cloudinaryService.uploadFile(file, `Doctors/${doctorId}/Services`);
      uploaded.push(result.secure_url);
    }

    return uploaded;
  }

  private async mergeServices(doctorId, existingServices: any[], newServices: any[], uploadedImages: string[]) {
    const updatedServices = [...existingServices];
    let uploadIndex = 0;

    for (const service of newServices) {
      const imageList = uploadedImages?.length
        ? uploadedImages.filter(Boolean)
        : service.imageService ?? [];

      const newService = {
        _id: new Types.ObjectId().toString(),
        description: service.description,
        maxprice: Number(service.maxprice),
        minprice: Number(service.minprice),
        imageService: imageList,
        specialtyId: service.specialtyId,
        specialtyName: service.specialtyName,
      };

      uploadIndex++;
      updatedServices.push(newService);

      // Đảm bảo bác sĩ được gắn vào chuyên khoa này (chỉ thêm nếu chưa có)
      await this.SpecialtyModel.findByIdAndUpdate(
        service.specialtyId,
        { $addToSet: { doctors: doctorId } }  // Tránh trùng
      );
    }

    return updatedServices;
  }

  private mergeWorkingHours(existingWH: any[], newWHList: any[]): any[] {
    const updatedWH = [...(existingWH || [])];

    for (const newWH of newWHList) {
      const isDuplicate = updatedWH.some(
        (wh) =>
          wh.dayOfWeek === newWH.dayOfWeek &&
          wh.hour === newWH.hour &&
          wh.minute === newWH.minute
      );

      if (!isDuplicate) {
        updatedWH.push({
          dayOfWeek: Number(newWH.dayOfWeek),
          hour: Number(newWH.hour),
          minute: Number(newWH.minute),
        });
      }
    }

    return updatedWH;
  }

  async updateDoctorProfile(doctorId: string, updateData: any) {
    if (!Types.ObjectId.isValid(doctorId)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const doctor = await this.DoctorModel.findById(doctorId);
    if (!doctor) {
      throw new BadRequestException('Bác sĩ không tồn tại');
    }

    // Danh sách các trường hợp lệ
    const allowedFields = [
      'name',
      'email',
      'phone',
      'password',
      'specialty',
      'experience',
      'description',
      'hospital',
      'address',
      'price',
      'cccd',
      'insurance',
      'workingHours',
      'minAge',
      'certificates',
      'services',
      'patientsCount',
      'ratingsCount',
    ];

    // Lọc dữ liệu hợp lệ
    const filteredUpdateData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key];
      }
    });

    // Xử lý tải lên giấy phép - sử dụng key 'license' từ form-data
    if (updateData.license) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(updateData.license, `Doctors/${doctorId}/License`);
        filteredUpdateData['licenseUrl'] = uploadResult.secure_url;
        console.log('Giấy phép đã được tải lên Cloudinary:', uploadResult.secure_url);
      } catch (error) {
        console.error('Lỗi Cloudinary:', error);
        throw new BadRequestException('Lỗi khi tải giấy phép lên Cloudinary');
      }
    }

    // Xử lý tải lên ảnh hồ sơ - sử dụng key 'image' từ form-data nếu có
    if (updateData.image) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(updateData.image, `Doctors/${doctorId}/Avatar`);
        filteredUpdateData['faceUrl'] = uploadResult.secure_url;
        console.log('Ảnh hồ sơ đã được tải lên Cloudinary:', uploadResult.secure_url);
      } catch (error) {
        console.error('Lỗi Cloudinary:', error);
        throw new BadRequestException('Lỗi khi tải ảnh hồ sơ lên Cloudinary');
      }
    }

    if (updateData.frontCccd) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(updateData.frontCccd, `Doctors/${doctorId}/Info`);
        filteredUpdateData['frontCccdUrl'] = uploadResult.secure_url;
        console.log('Front Cccd đã được tải lên Cloudinary:', uploadResult.secure_url);
      } catch (error) {
        console.error('Lỗi Cloudinary:', error);
        throw new BadRequestException('Lỗi khi tải front Cccd lên Cloudinary');
      }
    }

    if (updateData.backCccd) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(updateData.backCccd, `Doctors/${doctorId}/Info`);
        filteredUpdateData['backCccdUrl'] = uploadResult.secure_url;
        console.log('Back Cccd đã được tải lên Cloudinary:', uploadResult.secure_url);
      } catch (error) {
        console.error('Lỗi Cloudinary:', error);
        throw new BadRequestException('Lỗi khi tải back Cccd lên Cloudinary');
      }
    }

    // Nếu có cập nhật chuyên khoa, kiểm tra và lưu bác sĩ vào chuyên khoa
    if (filteredUpdateData['specialty']) {
      const specialtyId = filteredUpdateData['specialty'];

      // Kiểm tra xem chuyên khoa có tồn tại không
      const specialty = await this.SpecialtyModel.findById(specialtyId);
      if (!specialty) {
        throw new BadRequestException('Chuyên khoa không tồn tại');
      }

      // Xóa bác sĩ khỏi chuyên khoa cũ (nếu có)
      if (doctor.specialty && doctor.specialty.toString() !== specialtyId) {
        await this.SpecialtyModel.findByIdAndUpdate(
          doctor.specialty,
          { $pull: { doctors: doctorId } }, // Xóa doctorId khỏi mảng doctors
        );
      }

      // Thêm bác sĩ vào chuyên khoa mới
      await this.SpecialtyModel.findByIdAndUpdate(
        specialtyId,
        { $addToSet: { doctors: doctorId } }, // $addToSet tránh trùng lặp
        { new: true },
      );
    }

    // Log thông tin cập nhật
    console.log('Thông tin cập nhật bác sĩ:', {
      doctorId,
      updatedFields: Object.keys(filteredUpdateData),
      updatedData: filteredUpdateData
    });

    // Cập nhật thông tin bác sĩ
    const updatedDoctor = await this.DoctorModel.findByIdAndUpdate(
      doctorId,
      { $set: filteredUpdateData }, // Dùng `$set` để cập nhật
      { new: true },
    ).populate('specialty');

    if (!updatedDoctor) {
      throw new BadRequestException('Cập nhật thất bại!');
    }
    return {
      message: 'Cập nhật hồ sơ thành công!',
      updatedDoctor,
    };
  }

  //Lấy thời gian làm việc chưa được đặt 
  async getAvailableWorkingHours(
    doctorID: string,
    numberOfDays: number = 14,
    specificDate?: string,
  ) {
    if (!Types.ObjectId.isValid(doctorID)) {
      throw new BadRequestException('Invalid doctor ID');
    }

    const doctor = await this.DoctorModel.findById(doctorID);
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (!doctor.workingHours || doctor.workingHours.length === 0) {
      return {
        doctorID,
        doctorName: doctor.name,
        availableSlots: [],
        message: 'Doctor has not set working hours',
      };
    }

    const startDate = specificDate ? new Date(specificDate) : new Date();
    if (specificDate && isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid specific date format');
    }
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (specificDate ? 1 : numberOfDays));


    const bookedAppointments = await this.AppointmentModel
      .find({
        doctor: doctorID,
        date: {
          $gte: startDate.toISOString().split('T')[0],
          $lt: endDate.toISOString().split('T')[0],
        },
        status: { $in: ['pending', 'confirmed', 'done'] },
      })
      .select('date time')
      .lean();

    const availableSlots: any[] = [];
    const currentDate = new Date(startDate);

    while (currentDate < endDate) {
      const jsDay = currentDate.getDay();
      const dateString = currentDate.toISOString().split('T')[0];

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      if (currentDate < todayStart && !specificDate) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      let dbDay: number;
      switch (jsDay) {
        case 0: // Sunday
          dbDay = 7;
          break;
        case 1: // Monday  
          dbDay = 8; // Assuming 8 is Monday based on your data pattern
          break;
        case 2: // Tuesday
          dbDay = 2;
          break;
        case 3: // Wednesday
          dbDay = 3;
          break;
        case 4: // Thursday
          dbDay = 4;
          break;
        case 5: // Friday
          dbDay = 5;
          break;
        case 6: // Saturday
          dbDay = 6;
          break;
        default:
          dbDay = jsDay;
      }

      // Get working hours for this day
      const workingHoursForDay = doctor.workingHours.filter(
        (wh) => wh.dayOfWeek === dbDay,
      );

      if (workingHoursForDay.length > 0) {
        // Sort working hours by time
        const sortedWorkingHours = workingHoursForDay.sort((a, b) => {
          if (a.hour !== b.hour) return a.hour - b.hour;
          return a.minute - b.minute;
        });

        // Get booked times for this day
        const bookedTimesForDay = bookedAppointments
          .filter((apt) => {
            const aptDateString = apt.date instanceof Date
              ? apt.date.toISOString().split('T')[0]
              : apt.date;
            return aptDateString === dateString;
          })
          .map((apt) => apt.time);

        // Filter out slots that are booked or in the past
        const availableSlotsForDay = sortedWorkingHours
          .filter((wh) => {
            const timeString = `${wh.hour.toString().padStart(2, '0')}:${wh.minute
              .toString()
              .padStart(2, '0')}`;


            if (dateString === new Date().toISOString().split('T')[0]) {
              const currentTime = new Date();
              const slotTime = new Date(currentDate);
              slotTime.setHours(wh.hour, wh.minute, 0, 0);

              // Thêm 30 phút đệm
              const bufferTime = new Date(currentTime.getTime() + 30 * 60 * 1000);

              if (slotTime <= bufferTime) {
                return false;
              }
            }

            // kiểm tra xem thời gian này đã được đặt hay chưa
            return !bookedTimesForDay.includes(timeString);
          })
          .map((wh) => ({
            workingHourId: `${wh.dayOfWeek}-${wh.hour}-${wh.minute}`,
            time: `${wh.hour.toString().padStart(2, '0')}:${wh.minute
              .toString()
              .padStart(2, '0')}`,
            hour: wh.hour,
            minute: wh.minute,
            displayTime: this.formatDisplayTime(wh.hour, wh.minute),
          }));

        if (availableSlotsForDay.length > 0) {
          availableSlots.push({
            date: dateString,
            dayOfWeek: jsDay,
            dayName: this.getDayName(jsDay),
            displayDate: this.formatDisplayDate(currentDate),
            slots: availableSlotsForDay,
            totalSlots: availableSlotsForDay.length,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const result = {
      doctorID,
      doctorName: doctor.name,
      searchPeriod: {
        from: startDate.toISOString().split('T')[0],
        to: new Date(endDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], //trừ 1 ngày để không bao gồm ngày kết thúc
        numberOfDays: specificDate ? 1 : numberOfDays,
      },
      availableSlots,
      totalAvailableDays: availableSlots.length,
      totalAvailableSlots: availableSlots.reduce(
        (sum, day) => sum + day.totalSlots,
        0,
      ),
    };

    return result;
  }

  // Format giờ hiển thị
  private formatDisplayTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }


  private getDayName(dayOfWeek: number): string {
    const days = [
      'Sunday',    // 0
      'Monday',    // 1
      'Tuesday',   // 2
      'Wednesday', // 3
      'Thursday',  // 4
      'Friday',    // 5
      'Saturday',  // 6
    ];
    return days[dayOfWeek];
  }

  private formatDisplayDate(date: Date): string {
    const displayDate = new Date(date.getTime());

    return displayDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }

  // Đăng ký làm bác sĩ (Lưu vào bảng chờ phê duyệt)
  async applyForDoctor(userId: string, applyData: any) {
    // Kiểm tra người dùng tồn tại
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Người dùng không tồn tại.');

    // Kiểm tra nếu đã đăng ký trước đó
    const existing = await this.pendingDoctorModel.findOne({ userId });
    if (existing) {
      throw new BadRequestException('Bạn đã gửi yêu cầu trở thành bác sĩ trước đó.');
    } else {

      // Danh sách các trường hợp lệ từ form data
      const allowedFields = [
        'CCCD',
        'certificates',
        'experience',
        'license',
        'specialty',
        'faceUrl',
        'avatarURL',
        'licenseUrl',
        'frontCccdUrl',
        'backCccdUrl',
        'address',
      ];

      // Lọc dữ liệu hợp lệ
      const filteredApplyData = {};
      Object.keys(applyData).forEach((key) => {
        if (allowedFields.includes(key)) {
          filteredApplyData[key] = applyData[key];
        }
      });

      filteredApplyData['email'] = user.email;
      filteredApplyData['phone'] = user.phone;
      filteredApplyData['name'] = user.name;

      if (filteredApplyData['specialty']) {
        const specialtyId = filteredApplyData['specialty'];
        const specialtyExists = await this.SpecialtyModel.findById(specialtyId);
        if (!specialtyExists) {
          throw new BadRequestException('Chuyên khoa không tìm thấy.');
        }
      }

      if (applyData.faceUrl) {
        const uploadResult = await this.cloudinaryService.uploadFile(applyData.faceUrl, `PendingDoctors/${userId}/Face`);
        filteredApplyData['faceUrl'] = uploadResult.secure_url;
      }

      if (applyData.avatarURL) {
        const uploadResult = await this.cloudinaryService.uploadFile(applyData.avatarURL, `PendingDoctors/${userId}/Avatar`);
        filteredApplyData['avatarURL'] = uploadResult.secure_url;
      }

      if (applyData.licenseUrl) {
        const uploadResult = await this.cloudinaryService.uploadFile(applyData.licenseUrl, `PendingDoctors/${userId}/License`);
        filteredApplyData['licenseUrl'] = uploadResult.secure_url;
      }

      if (applyData.frontCccdUrl) {
        const uploadResult = await this.cloudinaryService.uploadFile(applyData.frontCccdUrl, `PendingDoctors/${userId}/Info`);
        filteredApplyData['frontCccdUrl'] = uploadResult.secure_url;
      }

      if (applyData.backCccdUrl) {
        const uploadResult = await this.cloudinaryService.uploadFile(applyData.backCccdUrl, `PendingDoctors/${userId}/Info`);
        filteredApplyData['backCccdUrl'] = uploadResult.secure_url;
      }

      const pendingDoctor = new this.pendingDoctorModel({
        userId,
        ...filteredApplyData,
      });

      const savedPendingDoctor = await pendingDoctor.save();

      if (!savedPendingDoctor) {
        throw new BadRequestException('Đăng ký thất bại!');
      }

      return {
        message: 'Đăng ký bác sĩ thành công!'
      };
    }
  }

  // Lấy danh sách bác sĩ chưa được xác thực
  async getPendingDoctors() {
    const cacheKey = 'pending_doctors';
    console.log('Trying to get pending doctors from cache...');

    const cached = await this.cacheService.getCache(cacheKey);
    if (cached) {
      console.log('Cache HIT');
      return cached;
    }

    console.log('Cache MISS - querying DB');
    const data = await this.pendingDoctorModel.find({ verified: false, isDeleted: false })

    if (!data) {
      throw new NotFoundException('Không có bác sĩ nào trong danh sách chờ phê duyệt.');
    } else {
      console.log('Setting cache...');
      await this.cacheService.setCache(cacheKey, data, 30 * 1000);
      return data;
    }
  }

  // Xóa bác sĩ khỏi danh sách chờ phê duyệt
  async deletePendingDoctor(userId: string) {
    const pendingDoctor = await this.pendingDoctorModel.findOne({ userId });
    if (!pendingDoctor) {
      throw new NotFoundException('Người dùng không tồn tại trong bảng chờ phê duyệt.');
    }

    //xoa cache 
    const cacheKey = 'pending_doctors';
    await this.cacheService.deleteCache(cacheKey);

    // Xóa khỏi bảng PendingDoctors
    await this.pendingDoctorModel.deleteOne({ userId });

    return { message: 'Xóa bác sĩ khỏi danh sách chờ phê duyệt thành công!' };
  }

  // Lấy thông tin bác sĩ từ bảng PendingDoctors
  async getPendingDoctorById(userId: string) {
    const pendingDoctor = await this.pendingDoctorModel.findOne({ userId });
    if (!pendingDoctor) {
      throw new NotFoundException('Người dùng không tồn tại trong bảng chờ phê duyệt.');
    }
    return pendingDoctor;
  }

  // Xác thực tài khoản bác sĩ bởi admin
  async verifyDoctor(userId: string) {
    const pendingDoctor = await this.pendingDoctorModel.findOne({ userId });
    if (!pendingDoctor)
      throw new NotFoundException(
        'Người dùng không tồn tại trong bảng chờ phê duyệt.',
      );

    // Lấy thông tin user từ bảng User
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Người dùng không tồn tại.');

    await user.save();

    // Xóa khỏi bảng PendingDoctors và cập nhật bảng Doctors
    await this.DoctorModel.create({
      _id: userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password,
      verified: true,
      cccd: pendingDoctor.CCCD,
      avatarURL: pendingDoctor.avatarURL,
      frontCccdUrl: pendingDoctor.frontCccdUrl,
      backCccdUrl: pendingDoctor.backCccdUrl,
      address: "chua co dia chi",
      licenseUrl: pendingDoctor.licenseUrl,
      certificates: pendingDoctor.certificates,
      experience: pendingDoctor.experience,
      specialty: pendingDoctor.specialty,
      isDeleted: pendingDoctor.isDeleted,
    });
    await this.pendingDoctorModel.deleteOne({ userId });
    await this.userModel.deleteOne({ _id: userId });
    await this.SpecialtyModel.findByIdAndUpdate(
      pendingDoctor.specialty,
      { $push: { doctors: userId } },
    );

    //xoa cache
    const cacheKey = 'pending_doctors';
    await this.cacheService.deleteCache(cacheKey);

    return {
      message: 'Xác thực bác sĩ thành công!',
    };
  }

  // Lấy tất cả bác sĩ đã xác thực
  async getVerifiedDoctors(): Promise<User[]> {
    return this.userModel.find({ verified: true });
  }

  async getDoctorsBySpecialtyId(specialtyId: string) {
    const specialty = await this.SpecialtyModel.findById(specialtyId)
      .populate('doctors')
      .exec();

    if (!specialty) {
      throw new NotFoundException('Chuyên khoa không tìm thấy.');
    }

    if (!specialty.doctors || specialty.doctors.length === 0) {
      throw new NotFoundException('Không có bác sĩ nào thuộc chuyên khoa này.');
    }

    return specialty;
  }
  // Lấy thông tin chi tiết 1 bác sĩ theo ID
  async getDoctorById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const cacheKey = `doctor_${id}`;
    console.log('Trying to get doctor by id from cache...');

    const cached = await this.cacheService.getCache(cacheKey);
    if (cached) {
      console.log('Cache HIT');
      return cached;
    }

    console.log('Cache MISS - querying DB');
    const doctor = await this.DoctorModel.findById(id).populate('specialty');
    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    console.log('Setting cache...');
    await this.cacheService.setCache(cacheKey, doctor, 30 * 1000);
    return doctor;
  }

  async getDoctorBySpecialtyName(specialtyName: string) {
    if (!specialtyName) {
      throw new BadRequestException('Tên chuyên khoa không được để trống');
    }

    console.log(`Fetching doctors by specialty name: ${specialtyName}`);

    // Tìm chuyên khoa
    const specialty = await this.SpecialtyModel.findOne({
      $or: [
        { specialtyNormalized: { $regex: new RegExp(specialtyName, 'i') } },
        { name: { $regex: new RegExp(specialtyName, 'i') } }
      ]
    }
    )

    if (!specialty) {
      throw new NotFoundException('Chuyên khoa không tìm thấy.');
    }

    // Tìm tất cả bác sĩ 
    const doctors = await this.DoctorModel.find({ specialty: specialty._id })
      .populate('specialty')
      .exec();

    if (!doctors || doctors.length === 0) {
      throw new NotFoundException('Không có bác sĩ nào thuộc chuyên khoa này.');
    }

    return doctors;
  }

  //tìm bác sĩ theo khoa không dấu
  // async searchDoctors(query: string) {
  //   return this.SpecialtyModel.find({
  //     $or: [
  //       { specialtyNormalized: { $regex: new RegExp(query, 'i') } },
  //       { name: { $regex: new RegExp(query, 'i') } }
  //     ]
  //   })
  //     .limit(5)
  //     .populate({
  //       path: 'doctors',
  //       select: 'name avatarURL'
  //     });
  // }


  async updateFcmToken(userId: string, token: string) {
    console.log(token);
    return this.DoctorModel.findByIdAndUpdate(
      userId,
      { fcmToken: token },
      { new: true }
    );
  }

  async getDoctorsByName(name: string) {
    if (!name) {
      throw new BadRequestException('Tên bác sĩ không được để trống');
    }

    console.log(`Fetching doctors by name: ${name}`);

    // Tìm tất cả bác sĩ có tên khớp và chỉ lấy trường cần thiết
    const doctors = await this.DoctorModel.find(
      { name: { $regex: new RegExp(name, 'i') } }
    )
      .populate('specialty')
      .select('_id name email phone avatarURL address verified');

    console.log(`[DoctorService] Found ${doctors.length} doctors`);

    if (!doctors || doctors.length === 0) {
      console.error(`[DoctorService] Không có bác sĩ nào với tên "${name}"`);
      throw new NotFoundException('Không có bác sĩ nào với tên này.');
    }

    return doctors;
  }

}
