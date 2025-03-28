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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { SignupDto } from 'src/dtos/signup.dto';
import { updateUserDto } from 'src/dtos/updateUser.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/Guard/jwt-auth.guard';
import { AdminGuard } from 'src/Guard/AdminGuard.guard';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private jwtService: JwtService,
  ) {}

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Post('postadmin')
  async postAdmin(@Body() signUpData: SignupDto) {
    return this.adminService.postAdmin(signUpData);
  }

  @Put('updateUser/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserdata: updateUserDto,
  ) {
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

  @Patch('verify-doctor/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async verifyDoctor(@Param('id') id: string) {
    return this.adminService.verifyDoctor(id);
  }

  @Delete('delete-user/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Delete('delete-doctor/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteDoctor(@Param('id') id: string) {
    return this.adminService.deleteDoctor(id);
  }
}
