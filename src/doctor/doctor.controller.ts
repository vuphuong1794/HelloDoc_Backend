import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Get,
  Put,
  UseGuards,
  Patch,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { SignupDto } from 'src/dtos/signup.dto';
import { loginDto } from 'src/dtos/login.dto';
import { JwtAuthGuard } from 'src/Guard/jwt-auth.guard';
import { Types } from 'mongoose';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) { }

  @Get('get-all')
  async getDoctors() {
    return this.doctorService.getDoctors();
  }

  @Post('register')
  async register(@Body() signUpData: SignupDto) {
    return this.doctorService.registerDoctor(signUpData);
  }

  @Post('login')
  async login(@Body() loginData: loginDto) {
    return this.doctorService.loginDoctor(loginData);
  }

  //@UseGuards(JwtAuthGuard) // Bảo vệ API, chỉ cho phép bác sĩ đăng nhập mới có quyền cập nhật
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'license', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]))
  @Put(':id/update-profile')
  async updateProfile(
    @Param('id') id: string,
    @UploadedFiles() files: { license?: Express.Multer.File[], image?: Express.Multer.File[] },
    @Body() updateData: any
  ) {
    if (files.license && files.license[0]) {
      updateData.license = files.license[0];
    }
    if (files.image && files.image[0]) {
      updateData.image = files.image[0];
    }
    return this.doctorService.updateDoctorProfile(id, updateData);
  }

  @Patch('apply-for-doctor/:id')
  async applyForDoctor(
    @Param('id') userId: string,
    @Body('license') license: string,
    @Body('specialty') specialty: string,
    @Body('hospital') hospital: string,
  ) {
    return this.doctorService.applyForDoctor(userId, license, specialty, hospital);
  }

  @Patch('verify-doctor/:id')
  async verifyDoctor(@Param('id') userId: string) {
    return this.doctorService.verifyDoctor(userId);
  }

  @Get('pending-doctors')
  async getPendingDoctors() {
    return this.doctorService.getPendingDoctors();
  }

  @Get('doctors')
  async getVerifiedDoctors() {
    return this.doctorService.getVerifiedDoctors();
  }

  @Get('specialty/:id')
  async getDoctorsBySpecialty(@Param('id') specialtyId: string) {
    return (
      await this.doctorService.getDoctorsBySpecialtyId(specialtyId)
    ).populate('doctors');
  }
}
