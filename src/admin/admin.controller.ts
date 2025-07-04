import {
  Body,
  Controller,
  Param,
  Get,
  Post,
  Put,
  UseGuards,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { SignupDto } from 'src/dtos/signup.dto';
import { updateUserDto } from 'src/dtos/updateUser.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/Guard/jwt-auth.guard';
import { AdminGuard } from 'src/Guard/AdminGuard.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Types } from 'mongoose';
import { Express } from 'express';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private jwtService: JwtService,
  ) { }

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('getallusers')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('userbyid/:id')
  async getUserByID(@Param('id') id: string) {
    return this.adminService.getUserByID(id);
  }

  @Get('doctors')
  async getDoctors() {
    return this.adminService.getDoctors();
  }

  @Post('postadmin')
  async postAdmin(@Body() signUpData: SignupDto) {
    return this.adminService.postAdmin(signUpData);
  }

  @UseInterceptors(FileInterceptor('avatarURL'))
  @Put('updateUser/:id')
  async updateUser(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateUserdata: any,
  ) {
    console.log("vô được")

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
    console.log('Uploaded files:', file);

    if (file) {
      updateUserdata.avatarURL = file;
      console.log("da tai file vao bien");
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
    return this.adminService.updateUser(id, updateUserdata);
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

  @Delete('delete-user/:id')
  //@UseGuards(JwtAuthGuard, AdminGuard)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Delete('delete-doctor/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteDoctor(@Param('id') id: string) {
    return this.adminService.deleteDoctor(id);
  }

  @Get('get-user/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Get('get-soft-deleted-users')
  async getSoftDeletedUsers() {
    return this.adminService.getSoftDeletedUsers();
  }

}
