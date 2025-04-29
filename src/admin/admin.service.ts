import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { Admin } from 'src/schemas/admin.schema';
import { SignupDto } from '../dtos/signup.dto';
import * as bcrypt from 'bcrypt';
import { updateUserDto } from 'src/dtos/updateUser.dto';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Doctor } from 'src/schemas/doctor.schema';
import { JwtService } from '@nestjs/jwt';
import { loginDto } from 'src/dtos/login.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(Admin.name) private AdminModel: Model<Admin>,
    @InjectModel(Doctor.name) private DoctorModel: Model<Doctor>,
    private cloudinaryService: CloudinaryService,
    private jwtService: JwtService,
  ) { }

  async getUsers() {
    return await this.UserModel.find();
  }

  async getUserByID(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    const user = await this.UserModel.findById(id);
    if (user) {
      return user;
    }

    return await this.DoctorModel.findById(id);
  }

  async getDoctors() {
    return await this.DoctorModel.find();
  }

  async postAdmin(signUpData: SignupDto) {
    const { email, password, name, phone } = signUpData;

    const emailInUse = await this.AdminModel.findOne({ email });
    if (emailInUse) {
      throw new BadRequestException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.AdminModel.create({
      email,
      password: hashedPassword,
      name,
      phone,
    });

    return { message: 'Admin created successfully' };
  }

  async updateUser(id: string, updateData: any) {
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    const objectId = new Types.ObjectId(id);

    // Check if the user exists
    let user = await this.UserModel.findById(objectId);
    if (!user) {
      user = await this.DoctorModel.findById(objectId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    // Prepare the update object
    const updateFields: Partial<updateUserDto> = {};

    if (updateData.email) updateFields.email = updateData.email;
    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.phone) updateFields.phone = updateData.phone;

    // 🔥 Only hash password if it is actually changed
    if (
      updateData.password &&
      updateData.password.trim() !== '' &&
      updateData.password !== user.password
    ) {
      updateFields.password = await bcrypt.hash(updateData.password, 10);
    } else {
      updateFields.password = user.password; // Keep the old password if it's not changed
    }

    if (updateData.avatarURL) {
      const upload = await this.cloudinaryService.uploadFile(updateData.avatarURL, `Users/${id}/Avatar`);
      updateFields.avatarURL = upload.secure_url;
    }

    let roleChanged = false;
    let newRole = user.role; // Keep the old role by default

    if (updateData.role && updateData.role !== user.role) {
      roleChanged = true;
      newRole = updateData.role;
    }

    // If no fields have changed, return a message
    if (Object.keys(updateFields).length === 0 && !roleChanged) {
      return { message: 'No changes detected' };
    }

    // Determine which model to update based on the user's existence in the models
    if (user instanceof this.UserModel) {
      // Update the user in UserModel
      const updatedUser = await this.UserModel.findByIdAndUpdate(
        objectId,
        { $set: updateFields },
        { new: true },
      );

      if (!updatedUser) {
        throw new NotFoundException('Update failed, user not found in UserModel');
      }

      // Handle role change if any
      if (roleChanged) {
        await this.handleRoleUpdate(objectId, user.role, newRole, updatedUser);
      }

      return { message: 'User updated successfully in UserModel', user: updatedUser };
    } else if (user instanceof this.DoctorModel) {
      // Update the user in DoctorModel
      const updatedDoctor = await this.DoctorModel.findByIdAndUpdate(
        objectId,
        { $set: updateFields },
        { new: true },
      );

      if (!updatedDoctor) {
        throw new NotFoundException('Update failed, user not found in DoctorModel');
      }

      // Handle role change if any
      if (roleChanged) {
        await this.handleRoleUpdate(objectId, user.role, newRole, updatedDoctor);
      }

      return { message: 'User updated successfully in DoctorModel', user: updatedDoctor };
    }
  }


  private async handleRoleUpdate(
    userId: Types.ObjectId,
    oldRole: string,
    newRole: string,
    userData: any,
  ) {
    const existingPassword = userData.password;

    // Xóa user khỏi collection cũ nếu cần
    if (oldRole === 'admin') {
      await this.AdminModel.findOneAndDelete({ userId });
    } else if (oldRole === 'doctor') {
      await this.DoctorModel.findOneAndDelete({ userId });
    } else {
      await this.UserModel.findOneAndDelete({ userId });
    }
    // Thêm vào collection mới nếu role thay đổi
    if (newRole === 'admin') {
      await this.AdminModel.create({
        userId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone, // Đảm bảo có phone
        password: existingPassword, // Đảm bảo có password
      });
      await this.UserModel.findByIdAndDelete(userId);
    } else if (newRole === 'doctor') {
      await this.DoctorModel.create({
        userId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: existingPassword,
      });
      await this.UserModel.findByIdAndDelete(userId);
    } else if (newRole === 'user') {
      // Xóa tài khoản khỏi AdminModel / DoctorModel
      await this.AdminModel.findOneAndDelete({ userId });
      await this.DoctorModel.findOneAndDelete({ userId });

      // Tạo lại tài khoản trong UserModel
      await this.UserModel.create({
        _id: userId, // Đặt lại ID cũ
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: existingPassword,
        role: 'user', // Đảm bảo đúng role
      });
    }
  }

  async generateAdminTokens(userId, email, name, role) {
    const accessToken = this.jwtService.sign(
      { userId, email, name, role },
      { expiresIn: '1d' },
    );
    return {
      accessToken,
    };
  }

  async deleteUser(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    const user = await this.UserModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.UserModel.findByIdAndDelete(id);
    return { message: 'User deleted successfully' };
  }

  async deleteDoctor(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    const doctor = await this.DoctorModel.findById(id);
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    await this.DoctorModel.findByIdAndDelete(id);
    return { message: 'Doctor deleted successfully' };
  }

  getUser(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.UserModel.findById(id);
  }
}
