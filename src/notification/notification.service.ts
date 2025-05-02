import { Injectable, NotFoundException, BadRequestException  } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from 'src/schemas/notification.schema';
import { Model } from 'mongoose';
import * as moment from 'moment-timezone';

@Injectable()
export class NotificationService {
  constructor(
            @InjectModel(Notification.name) private notificationModel: Model<Notification>,
        ) { }
        
  async createNotification(createNotificationDto: CreateNotificationDto) {
    const createdNotification = new this.notificationModel({
      user: createNotificationDto.userId,
      userModel: createNotificationDto.userModel,
      content: createNotificationDto.content,
  });

  return createdNotification.save();
  }

  async getAllNotification() {
    return await this.notificationModel.find();
  }

  async getNotificationsByUserId(userId: string) {
    try {
        const postComments = await this.notificationModel.find({ user: userId }).exec();
        return postComments;
    } catch (error) {
        console.error('Error fetching notifications by userId:', error);
        throw new Error('Error fetching notifications by userId');
    }
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const updatedNotification = await this.notificationModel.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true } // để trả về bản ghi đã được cập nhật
      );
  
      if (!updatedNotification) {
        throw new Error('Notification not found');
      }
  
      return updatedNotification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Error marking notification as read');
    }
  }
  

  update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return `This action updates a #${id} notification`;
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}
