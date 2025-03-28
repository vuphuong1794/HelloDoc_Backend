import { BadRequestException, Body, Controller, Param, Post, Get, Put, UseGuards } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { SignupDto } from 'src/dtos/signup.dto';
import { loginDto } from 'src/dtos/login.dto';
import { JwtAuthGuard } from 'src/Guard/jwt-auth.guard';
import { Types } from 'mongoose';


@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

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

  @UseGuards(JwtAuthGuard) // Bảo vệ API, chỉ cho phép bác sĩ đăng nhập mới có quyền cập nhật
  @Put(':id/update-profile')
  async updateProfile(
    @Param('id') id: string,
    @Body() updateData: any
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
    return this.doctorService.updateDoctorProfile(id, updateData);
  }
}
