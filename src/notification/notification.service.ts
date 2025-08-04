import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException  } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from 'src/schemas/notification.schema';
import { Model } from 'mongoose';

@Injectable()
export class NotificationService {
  constructor(
  @InjectModel(Notification.name) private notificationModel: Model<Notification>,
) { }
        
  async createNotification(createNotificationDto: CreateNotificationDto) {
    try {
      const createdNotification = new this.notificationModel({
        user: createNotificationDto.userId,
        userModel: createNotificationDto.userModel,
        type:  createNotificationDto.type,
        content: createNotificationDto.content,
        navigatePath: createNotificationDto.navigatePath,
      });

      return await createdNotification.save();
    } catch (error) {
      console.error('Lỗi khi tạo thông báo:', error);
      throw new InternalServerErrorException('Đã xảy ra lỗi khi tạo thông báo');
    }
  }

  async getAllNotification() {
    try {
      return await this.notificationModel.find();
    } catch (error) {
      console.error('Lỗi khi lấy tất cả thông báo:', error);
      throw new InternalServerErrorException('Đã xảy ra lỗi khi lấy tất cả thông báo');
    }
  }

  async getNotificationsByUserId(userId: string) {
    try {
      const notifications = await this.notificationModel.find({ user: userId }).exec();
      return notifications;
    } catch (error) {
      console.error('Lỗi khi lấy thông báo theo người dùng:', error);
      throw new InternalServerErrorException('Đã xảy ra lỗi khi lấy thông báo theo người dùng');
    }
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const updatedNotification = await this.notificationModel.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true },
      );

      if (!updatedNotification) {
        throw new NotFoundException('Không tìm thấy thông báo');
      }

      return updatedNotification;
    } catch (error) {
      console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
      throw new InternalServerErrorException('Đã xảy ra lỗi khi đánh dấu thông báo đã đọc');
    }
  }
  

  update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return `This action updates a #${id} notification`;
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}
