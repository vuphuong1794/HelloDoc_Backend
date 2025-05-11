import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { NewsComment } from '../schemas/news-comment.schema';
import { Model } from 'mongoose';
import { CreateNewsCommentDto } from './dto/create-news-comment.dto';
import { UpdateNewsCommentDto } from './dto/update-news-comment.dto';
import { News } from '../schemas/news.schema';
import { User } from '../schemas/user.schema';
import { Doctor } from '../schemas/doctor.schema';
import * as admin from 'firebase-admin';
import { Admin } from 'src/schemas/admin.schema';

@Injectable()
export class NewsCommentService {
    constructor(
        @InjectModel(NewsComment.name) private newsCommentModel: Model<NewsComment>,
        @InjectModel(News.name) private newsModel: Model<News>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
        @InjectModel(Admin.name) private adminModel: Model<Admin>,
    ) { }

    async create(newsId: string, dto: CreateNewsCommentDto) {
        let model: string;

        const user = await this.userModel.findById(dto.userId);
        if (user) model = 'User';
        else {
            const doctor = await this.doctorModel.findById(dto.userId);
            if (doctor) model = 'Doctor';
            else {
                const admin = await this.adminModel.findById(dto.userId);
                if (admin) model = 'Admin';
                else throw new NotFoundException('Không tìm thấy người dùng');
            }
        }

        const comment = new this.newsCommentModel({
            user: dto.userId,
            userModel: model,
            news: newsId,
            content: dto.content,
        });

        return await comment.save();
    }


    async findByNews(newsId: string) {
        return await this.newsCommentModel.find({ news: newsId }).populate('user', 'name avatarURL');
    }

    async findByUser(userId: string) {
        return await this.newsCommentModel.find({ user: userId }).populate('news', 'title');
    }

    async update(id: string, dto: UpdateNewsCommentDto) {
        const updated = await this.newsCommentModel.findByIdAndUpdate(id, dto, { new: true });
        if (!updated) throw new NotFoundException('Comment không tồn tại');
        return updated;
    }

    async delete(id: string) {
        const deleted = await this.newsCommentModel.findByIdAndDelete(id);
        if (!deleted) throw new NotFoundException('Comment không tồn tại');
        return { message: 'Xóa bình luận thành công' };
    }

    async notifyComment(userId: string, userModel: string, message: string) {
        try {
            if (userModel == 'User') {
                const user = await this.userModel.findById(userId);
                if (user) {
                    if (user?.fcmToken) {
                        await admin.messaging().send({
                            token: user.fcmToken,
                            notification: {
                                title: 'HelloDoc',
                                body: message,
                            },
                            data: {
                                bigText: message, // Truyền toàn bộ nội dung dài ở đây
                            },
                        });
                        console.log(`Đã gửi thông báo đến người dùng ${userId}`);
                        return
                    } else {
                        console.warn(`Người dùng ${userId} không có fcmToken`);
                        return
                    }
                }
            } else if (userModel == 'Doctor') {
                const doctor = await this.doctorModel.findById(userId);
                if (doctor) {
                    if (doctor?.fcmToken) {
                        await admin.messaging().send({
                            token: doctor.fcmToken,
                            notification: {
                                title: 'HelloDoc',
                                body: message,
                            },
                            data: {
                                bigText: message, // Truyền toàn bộ nội dung dài ở đây
                            },
                        });
                        console.log(`Đã gửi thông báo đến người dùng ${userId}`);
                        return
                    } else {
                        console.warn(`Người dùng ${userId} không có fcmToken`);
                        return
                    }
                }
            }
        } catch (error) {
            console.error(`Lỗi khi gửi thông báo đến bác sĩ ${userId}:`, error);
        }
    }
}
