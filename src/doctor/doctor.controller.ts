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
  NotFoundException,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { SignupDto } from 'src/dtos/signup.dto';
import { loginDto } from 'src/dtos/login.dto';
import { JwtAuthGuard } from 'src/Guard/jwt-auth.guard';
import { Model } from 'mongoose';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { PendingDoctor } from 'src/schemas/PendingDoctor.shema';
import { Specialty } from 'src/schemas/specialty.schema';


@Controller('doctor')
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Specialty.name) private SpecialtyModel: Model<Specialty>,
    @InjectModel(PendingDoctor.name) private pendingDoctorModel: Model<PendingDoctor>,
  ) { }

  @Get('get-all')
  async getDoctors() {
    return this.doctorService.getDoctors();
  }
  @Get(':id')
  async getDoctorById(@Param('id') id: string) {
    return this.doctorService.getDoctorById(id);
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
    { name: 'frontCccd', maxCount: 1 },
    { name: 'backCccd', maxCount: 1 },
  ]))
  @Put(':id/update-profile')
  async updateProfile(
    @Param('id') id: string,
    @UploadedFiles() files: { license?: Express.Multer.File[], image?: Express.Multer.File[], frontCccd?: Express.Multer.File[], backCccd?: Express.Multer.File[] },
    @Body() updateData: any
  ) {
    if (files?.license?.[0]) {
      updateData.license = files.license[0];
    }

    if (files?.image?.[0]) {
      updateData.image = files.image[0];
    }

    if (files?.frontCccd?.[0]) {
      updateData.frontCccd = files.frontCccd[0];
    }

    if (files?.backCccd?.[0]) {
      updateData.backCccd = files.backCccd[0];
    }
    return this.doctorService.updateDoctorProfile(id, updateData);
  }

  @Patch('apply-for-doctor/:id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'licenseUrl', maxCount: 1 },
      { name: 'faceUrl', maxCount: 1 },
      { name: 'avatarURL', maxCount: 1 },
      { name: 'frontCccdUrl', maxCount: 1 },
      { name: 'backCccdUrl', maxCount: 1 },
    ])
  )
  async applyForDoctor(
    @Param('id') userId: string,
    @UploadedFiles() files: {
      licenseUrl?: Express.Multer.File[],
      faceUrl?: Express.Multer.File[],
      avatarURL?: Express.Multer.File[],
      frontCccdUrl?: Express.Multer.File[],
      backCccdUrl?: Express.Multer.File[]
    },
    @Body() formData: any,
  ) {
    const doctorData = { ...formData };

    if (files?.licenseUrl?.[0]) {
      doctorData.licenseUrl = files.licenseUrl[0];
    }

    if (files?.faceUrl?.[0]) {
      doctorData.faceUrl = files.faceUrl[0];
    }

    if (files?.avatarURL?.[0]) {
      doctorData.avatarURL = files.avatarURL[0];
    }

    if (files?.frontCccdUrl?.[0]) {
      doctorData.frontCccdUrl = files.frontCccdUrl[0];
    }

    if (files?.backCccdUrl?.[0]) {
      doctorData.backCccdUrl = files.backCccdUrl[0];
    }

    return this.doctorService.applyForDoctor(userId, doctorData);
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

  @Put(':id/fcm-token')
  async updateFcmToken(@Param('id') id: string, @Body('token') token: string) {
    return this.doctorService.updateFcmToken(id, token);
  }
}
