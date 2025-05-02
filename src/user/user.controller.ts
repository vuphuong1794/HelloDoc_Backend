import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put(':id/fcm-token')
  async updateFcmToken(@Param('id') id: string, @Body('token') token: string) {
    return this.userService.updateFcmToken(id, token);
  }
}
