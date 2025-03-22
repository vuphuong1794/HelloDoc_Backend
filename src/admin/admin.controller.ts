import { Body, Controller, Param, Get, Post, Put } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SignupDto } from 'src/dtos/signup.dto';
import { updateUserDto } from 'src/dtos/updateUser.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Post('postadmin')
  async postAdmin(@Body() signUpData: SignupDto){
    return this.adminService.postAdmin(signUpData);
  }
  
  @Put('updateuser/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserdata: updateUserDto,
  ) {
    return this.adminService.updateUser(id, updateUserdata);
  }
  
}
