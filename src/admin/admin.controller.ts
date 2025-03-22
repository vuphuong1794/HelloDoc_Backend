import { Body, Controller, Get, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SignupDto } from 'src/dtos/signup.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Post('admin')
  async postAdmin(@Body() signUpData: SignupDto){
    return this.adminService.postAdmin(signUpData);
  }
}
