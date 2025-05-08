import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { NewsFavorite } from '../schemas/news-favorite.schema';
import { News } from '../schemas/news.schema';
import { User } from '../schemas/user.schema';
import { Doctor } from '../schemas/doctor.schema';
import { Model } from 'mongoose';
import { CreateNewsFavoriteDto } from './dto/create-news-favorite.dto';
import { GetNewsFavoriteDto } from './dto/get-news-favorite.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class NewsFavoriteService {
    constructor(
        @InjectModel(NewsFavorite.name) private newsFavoriteModel: Model<NewsFavorite>,
        @InjectModel(News.name) private newsModel: Model<News>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    ) { }

    async getNewsFavoritesByNewsId(newsId: string, dto: GetNewsFavoriteDto) {
        const favorite = await this.newsFavoriteModel.findOne({ user: dto.userId, news: newsId });
        const total = await this.newsFavoriteModel.countDocuments({ news: newsId });
        return { isFavorited: !!favorite, totalFavorites: total };
    }

    async updateNewsFavoriteByNewsId(newsId: string, dto: CreateNewsFavoriteDto) {
        const favorite = await this.newsFavoriteModel.findOne({ user: dto.userId, news: newsId });

        if (favorite) {
            await this.newsFavoriteModel.deleteOne({ _id: favorite._id });
        } else {
            await this.newsFavoriteModel.create({ user: dto.userId, userModel: dto.userModel, news: newsId });
        }

        const total = await this.newsFavoriteModel.countDocuments({ news: newsId });
        return { isFavorited: !favorite, totalFavorites: total };
    }

    async getNewsFavoritesByUserId(userId: string) {
        return await this.newsFavoriteModel.find({ user: userId })
            .populate({ path: 'news', select: 'title media content' })
            .exec();
    }

    async notifyFavorite(userId: string, userModel: string, message: string) {
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
