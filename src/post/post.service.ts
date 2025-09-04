import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from 'src/schemas/Post.schema';
import { Model } from 'mongoose';
import { CreatePostDto } from 'src/post/dto/createPost.dto';
import { UpdatePostDto } from 'src/post/dto/updatePost.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Doctor } from 'src/schemas/doctor.schema';
import { User } from 'src/schemas/user.schema';
import { CacheService } from 'src/cache.service';
import { Express } from 'express';
import * as dayjs from 'dayjs';

@Injectable()
export class PostService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
        @InjectModel(Post.name) private postModel: Model<Post>,
        private cloudinaryService: CloudinaryService,
        private cacheService: CacheService,
    ) { }

    private async findOwnerById(ownerId: string): Promise<User | Doctor> {
        try {
            const owner = await this.userModel.findById(ownerId).lean()
                || await this.doctorModel.findById(ownerId).lean();

            if (!owner) {
                throw new NotFoundException(`Không tìm thấy người dùng với id  ${ownerId}`);
            }
            return owner;
        } catch (error) {
            console.error(`Error finding owner: ${error.message}`);
            throw new InternalServerErrorException('Lỗi khi tìm người dùng');
        }
    }

    async create(createPostDto: CreatePostDto): Promise<Post> {
        try {
            const uploadedMediaUrls: string[] = [];

            if (createPostDto.images && createPostDto.images.length > 0) {
                for (const file of createPostDto.images) {
                    try {
                        const uploadResult = await this.cloudinaryService.uploadFile(file, `Posts/${createPostDto.userId}`);
                        uploadedMediaUrls.push(uploadResult.secure_url);
                        console.log('Ảnh đã tải lên Cloudinary:', uploadResult.secure_url);
                    } catch (error) {
                        console.error('Lỗi Cloudinary khi upload media:', error);
                        throw new BadRequestException('Lỗi khi tải media lên Cloudinary');
                    }
                }
            }

            const nowVN = dayjs().add(7, "hour").toDate();

            const createdPost = new this.postModel({
                user: createPostDto.userId,
                userModel: createPostDto.userModel,
                content: createPostDto.content,
                media: uploadedMediaUrls,
                keywords: createPostDto.keywords || '',
                createdAt: nowVN,
                updatedAt: nowVN
            });

            return createdPost.save();
        } catch (error) {
            console.error('Error creating post:', error);
            throw new InternalServerErrorException('Lỗi khi tạo bài viết');
        }
    }

    async getAll(limit: number, skip: number): Promise<{ posts: Post[]; hasMore: boolean }> {
        try {
            const total = await this.postModel.countDocuments({
                $or: [{ isHidden: false }, { isHidden: { $exists: false } }],
            });

            const posts = await this.postModel
                .find({ $or: [{ isHidden: false }, { isHidden: { $exists: false } }] })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'user',
                    select: 'name imageUrl avatarURL',
                })
                .exec();

            const hasMore = skip + posts.length < total;

            return { posts, hasMore };
        } catch (error) {
            console.error('Error getting paginated posts:', error);
            throw new InternalServerErrorException('Lỗi khi lấy danh sách bài viết');
        }
    }

    async getOne(id: string): Promise<Post> {
        try {
            const post = await this.postModel
                .findById(id)
                .populate({
                    path: 'user',
                    select: 'name avatarURL',
                })
                .exec();

            if (!post) {
                throw new NotFoundException(`Không tìm thấy bài viết với id  ${id}`);
            }
            return post;
        } catch (error) {
            console.error('Error getting post:', error);
            throw new InternalServerErrorException('Lỗi khi lấy bài viết');
        }
    }

    async deleteCache(ownerId: string) {
        try {
            const cacheKey = `posts_by_owner_${ownerId}`;
            await this.cacheService.deleteCache(cacheKey);
        } catch (error) {
            console.error('Error deleting cache:', error);
        }
    }

    async getByUserId(ownerId: string): Promise<Post[]> {
        try {
            await this.findOwnerById(ownerId);
            const posts = await this.postModel
                .find({
                    user: ownerId,
                    $or: [
                        { isHidden: false },
                        { isHidden: { $exists: false } } //để xử lý các bài viết cũ chưa có trường này
                    ]
                })
                .sort({ createdAt: -1 })
                .populate({
                    path: 'user',
                    select: 'name imageUrl avatarURL',
                })
                .exec();

            return posts;
        } catch (error) {
            console.error('Error getting posts by owner:', error);
            throw new InternalServerErrorException('Lỗi khi lấy bài viết của người dùng');
        }
    }

    async update(id: string, updatePostDto: UpdatePostDto) {
        try {
            const existingPost = await this.postModel.findById(id);
            if (!existingPost) throw new NotFoundException('Post not found');

            // Giữ lại media cũ nếu không có media mới được gửi lên
            const mediaUrls = updatePostDto.media ?? existingPost.media ?? [];

            // Xử lý ảnh mới nếu có
            const images = (updatePostDto.images ?? []) as Express.Multer.File[];
            if (images.length > 0) {
                const newMediaUrls: string[] = [];
                for (const file of images) {
                    const uploadResult = await this.cloudinaryService.uploadFile(
                        file,
                        `Posts/${existingPost.user}`,
                    );
                    newMediaUrls.push(uploadResult.secure_url);
                }
                // Kết hợp ảnh cũ và ảnh mới
                existingPost.media = [...mediaUrls, ...newMediaUrls];
            } else if (updatePostDto.media) {
                // Nếu chỉ cập nhật media (không có ảnh mới)
                existingPost.media = updatePostDto.media;
            }

            if (updatePostDto.content) {
                existingPost.content = updatePostDto.content;
            }

            return await existingPost.save();
        } catch (error) {
            console.error('Error updating post:', error);
            throw new InternalServerErrorException('Lỗi khi cập nhật bài viết');
        }
    }

    async delete(id: string): Promise<{ message: string }> {
        try {
            const updated = await this.postModel.findByIdAndUpdate(
                id,
                { isHidden: true },
                { new: true }
            );
            if (!updated) {
                throw new NotFoundException(`Post with id ${id} not found`);
            }

            return { message: `Post with id ${id} deleted successfully` };
        } catch (error) {
            console.error('Error deleting post:', error);
            throw new InternalServerErrorException('Lỗi khi xóa bài viết');
        }
    }

    async search(query: string) {
        return this.postModel.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } },
                { keywords: { $regex: query, $options: 'i' } }
            ]
        })
            .limit(5)
            .populate('user', '_id name avatarURL');
    }


    async searchPosts(query: string) {
        const results = await this.postModel.aggregate([
            {
                $search: {
                    index: 'default', // tên index Atlas Search bạn tạo
                    text: {
                        query: query,
                        path: ['content', 'keywords'], // field nào muốn search
                    },
                },
            },
            {
                $project: {
                    content: 1,
                    keywords: 1,
                    score: { $meta: 'searchScore' }, // lấy score giống UI
                },
            },
            {
                $sort: { score: -1 },
            },
        ]);

        return results;
    }

}
