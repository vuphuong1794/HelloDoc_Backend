import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { SignupDto } from 'src/dtos/signup.dto';
import { Doctor } from 'src/schemas/doctor.schema';
import { loginDto } from 'src/dtos/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class DoctorService {
  constructor(
    @InjectModel(Doctor.name) private DoctorModel: Model<Doctor>,
    private jwtService: JwtService,
  ) {}
  async getDoctors() {
    return await this.DoctorModel.find();
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
  
    // Cập nhật thông tin bác sĩ
    const updatedDoctor = await this.DoctorModel.findByIdAndUpdate(
      doctorId,
      { $set: filteredUpdateData }, // Dùng `$set` để cập nhật
      { new: true } // Trả về dữ liệu mới sau khi cập nhật
    );
  
    if (!updatedDoctor) {
      throw new BadRequestException('Cập nhật thất bại!');
    }
  
    return {
      message: 'Cập nhật hồ sơ thành công!',
      updatedDoctor,
    };
}
}
