import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { News } from '../schemas/news.schema';
import { Model } from 'mongoose';
import { CreateNewsDto } from './dto/createNews.dto';
import { UpdateNewsDto } from './dto/updateNews.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { User } from '../schemas/user.schema';
import { Doctor } from '../schemas/doctor.schema';

@Injectable()
export class NewsService {
    constructor(
        @InjectModel(News.name) private newsModel: Model<News>,
        private cloudinaryService: CloudinaryService,
    ) { }

    async create(createNewsDto: CreateNewsDto): Promise<News> {
        try {
            const uploadedMediaUrls: string[] = [];

            if (createNewsDto.images && createNewsDto.images.length > 0) {
                for (const file of createNewsDto.images) {
                    const upload = await this.cloudinaryService.uploadFile(file, `News/${createNewsDto.adminId}`);
                    uploadedMediaUrls.push(upload.secure_url);
                }
            }

            const created = new this.newsModel({
                admin: createNewsDto.adminId,
                title: createNewsDto.title,
                content: createNewsDto.content,
                media: uploadedMediaUrls,
            });

            return await created.save();
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi tạo tin tức');
        }
    }

    async getAll(): Promise<News[]> {
        return await this.newsModel.find({ isHidden: false }).sort({ createdAt: -1 }).exec();
    }

    async getOne(id: string): Promise<News> {
        const news = await this.newsModel.findById(id).exec();
        if (!news) throw new NotFoundException('Không tìm thấy tin tức');
        return news;
    }

    async update(id: string, updateDto: UpdateNewsDto): Promise<News> {
        const news = await this.newsModel.findById(id);
        if (!news) throw new NotFoundException('Tin tức không tồn tại');

        const uploadedMediaUrls: string[] = [];
        if (updateDto.images && updateDto.images.length > 0) {
            for (const file of updateDto.images) {
                const upload = await this.cloudinaryService.uploadFile(file, `News/${news.admin}`);
                uploadedMediaUrls.push(upload.secure_url);
            }
            news.media = uploadedMediaUrls;
        } else if (updateDto.media && updateDto.media.length > 0) {
            news.media = updateDto.media;
        }

        if (updateDto.title) news.title = updateDto.title;
        if (updateDto.content) news.content = updateDto.content;

        return await news.save();
    }

    async delete(id: string): Promise<{ message: string }> {
        const updated = await this.newsModel.findByIdAndUpdate(id, { isHidden: true }, { new: true });
        if (!updated) throw new NotFoundException('Tin tức không tồn tại');
        return { message: 'Đã ẩn tin tức thành công' };
    }
}
