import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateFcmDto } from './dto/update-fcm.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put(':id/fcm-token')
  async updateFcmToken(@Param('id') id: string, @Body() updateFcmDto: UpdateFcmDto) {
    return this.userService.updateFcmToken(id, updateFcmDto);
  }
}
