import { Body, Controller, Param, Get, Post, Put } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SignupDto } from 'src/dtos/signup.dto';
import { updateUserDto } from 'src/dtos/updateUser.dto';
import { JwtService } from '@nestjs/jwt';
import { loginDto } from 'src/dtos/login.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService, private jwtService: JwtService) {}

  @Post('login')
  async loginAdmin(@Body() loginData: loginDto) {
    return this.adminService.loginAdmin(loginData);
  }
  
  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Post('postadmin')
  async postAdmin(@Body() signUpData: SignupDto){
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
    const accessToken = this.jwtService.sign({userId, email, name, role}, {expiresIn: '1d'});
    return {
        accessToken
    }
}
}
