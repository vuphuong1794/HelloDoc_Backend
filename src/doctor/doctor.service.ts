import {
  BadRequestException,
  Injectable,
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

@Injectable()
export class DoctorService {
  constructor(
    @InjectModel(Doctor.name) private DoctorModel: Model<Doctor>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(PendingDoctor.name)
    private pendingDoctorModel: Model<PendingDoctor>,
    @InjectModel(Specialty.name) private SpecialtyModel: Model<Specialty>, // Thay thế bằng model chuyên khoa thực tế của bạn
    private jwtService: JwtService,
  ) {}

  async getDoctors() {
    return await this.DoctorModel.find().populate('specialty');
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
      'specialty',
      'licenseUrl',
      'experience',
      'description',
      'hospital',
      'address',
      'price',
      'insurance',
      'workingHours',
      'minAge',
      'imageUrl',
    ];

    // Lọc dữ liệu hợp lệ
    const filteredUpdateData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key];
      }
    });

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
  async applyForDoctor(userId: string, license: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Người dùng không tồn tại.');

    await this.pendingDoctorModel.create({
      userId,
      license,
      verified: false,
    });
  }

  // Lấy danh sách bác sĩ chưa được xác thực
  async getPendingDoctors() {
    return this.pendingDoctorModel.find({ verified: false });
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

    // Cập nhật user
    user.isDoctor = true;
    user.verified = true;
    await user.save();

    // Xóa khỏi bảng PendingDoctors và cập nhật bảng Doctors
    await this.DoctorModel.create({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password,
      verified: true,
      licenseUrl: pendingDoctor.license,
    });
    await this.pendingDoctorModel.deleteOne({ userId });
    await this.userModel.deleteOne({ _id: userId });

    return user;
  }

  // Lấy tất cả bác sĩ đã xác thực
  async getVerifiedDoctors(): Promise<User[]> {
    return this.userModel.find({ isDoctor: true, verified: true });
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
}
