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

@Injectable()
export class DoctorService {
  constructor(
    @InjectModel(Doctor.name) private DoctorModel: Model<Doctor>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(PendingDoctor.name) private pendingDoctorModel: Model<PendingDoctor>,
    @InjectModel(Specialty.name) private SpecialtyModel: Model<Specialty>,
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
      filteredData.services = this.mergeServices(doctor.services, filteredData.services, uploadedImages);
    }
  
    // Xử lý workingHours nếu có
    if (Array.isArray(filteredData.workingHours)) {
      filteredData.workingHours = this.mergeWorkingHours(doctor.workingHours, filteredData.workingHours);
    }
  
    // Gán và lưu
    Object.assign(doctor, filteredData);
    await doctor.save();
    await this.cacheService.deleteCache(`doctor_${doctorId}`);

    return {
      message: 'Cập nhật thông tin phòng khám thành công',
      data: doctor,
    };
  }
  
  private filterAllowedFields(data: any) {
    const allowed = ['description', 'address', 'services', 'workingHours'];
    const filtered: any = {};
    for (const key of allowed) {
      if (key in data) filtered[key] = data[key];
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
  
  private mergeServices(existingServices: any[], newServices: any[], uploadedImages: string[]): any[] {
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
        specialtyID: service.specialtyID,
        specialtyName: service.specialtyName,
      };
  
      uploadIndex++;
      updatedServices.push(newService);
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
    const data = await this.pendingDoctorModel.find({ verified: false })


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

  async updateFcmToken(userId: string, token: string) {
    console.log(token);
    return this.DoctorModel.findByIdAndUpdate(
      userId,
      { fcmToken: token },
      { new: true }
    );
  }
}
