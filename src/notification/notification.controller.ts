import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('create')
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.createNotification(createNotificationDto);
  }

  @Get('get-all')
  async getAllNotification() {
    return this.notificationService.getAllNotification();
  }

  @Get('get-by-user-id/:userId')
  async getNotificationsByUserId(@Param('userId') userId: string) {
    return this.notificationService.getNotificationsByUserId(userId);
  }

  @Patch(':postId/mark-as-read')
  markAsRead(@Param('postId') postId: string) {
    return this.notificationService.markAsRead(postId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationService.update(+id, updateNotificationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationService.remove(+id);
  }
}
