import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from 'src/schemas/Post.schema';
import { Model } from 'mongoose';
import { CreatePostDto } from 'src/post/dto/createPost.dto';
import { UpdatePostDto } from 'src/dtos/updatePost.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Doctor } from 'src/schemas/doctor.schema';
import { User } from 'src/schemas/user.schema';
import { CacheService } from 'src/cache.service';

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

            await this.deleteCache(createPostDto.userId);

            const createdPost = new this.postModel({
                user: createPostDto.userId,
                userModel: createPostDto.userModel,
                content: createPostDto.content,
                media: uploadedMediaUrls,
            });

            await this.deleteCache(createPostDto.userId);
            return createdPost.save();
        } catch (error) {
            console.error('Error creating post:', error);
            throw new InternalServerErrorException('Lỗi khi tạo bài viết');
        }
    }

    async getAll(): Promise<Post[]> {
        const cacheKey = 'all_posts';
        try {
            console.log('Trying to get from cache...');
            const cached = await this.cacheService.getCache(cacheKey);
            if (cached) {
                console.log('Cache HIT');
                return cached;
            }

            console.log('Cache MISS - querying DB');
            const data = await this.postModel
                .find()
                .sort({ createdAt: -1 })
                .populate({
                    path: 'user',
                    select: 'name imageUrl avatarURL',
                })
                .exec();

            console.log('Setting cache...');
            await this.cacheService.setCache(cacheKey, data, 30 * 1000);
            return data;
        } catch (error) {
            console.error('Error getting all posts:', error);
            throw new InternalServerErrorException('Lỗi khi lấy danh sách bài viết');
        }
    }

    async getOne(id: string): Promise<Post> {
        try {
            const post = await this.postModel
                .findById(id)
                .populate({
                    path: 'user',
                    select: 'name imageUrl avatarURL',
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

    async getById(ownerId: string): Promise<Post[]> {
        try {
            await this.findOwnerById(ownerId);

            const cacheKey = `posts_by_owner_${ownerId}`;
            console.log('Trying to get user posts from cache...');
            const cached = await this.cacheService.getCache(cacheKey);
            if (cached) {
                console.log('Cache HIT');
                return cached;
            }

            console.log('Cache MISS - querying DB');
            const posts = await this.postModel
                .find({ user: ownerId })
                .sort({ createdAt: -1 })
                .populate({
                    path: 'user',
                    select: 'name imageUrl avatarURL',
                })
                .exec();

            console.log('Setting cache...');
            await this.cacheService.setCache(cacheKey, posts, 3600 * 1000);
            return posts;
        } catch (error) {
            console.error('Error getting posts by owner:', error);
            throw new InternalServerErrorException('Lỗi khi lấy bài viết của người dùng');
        }
    }

    async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
        try {
            const updatedPost = await this.postModel
                .findByIdAndUpdate(
                    id,
                    {
                        user: updatePostDto.userId,
                        content: updatePostDto.content,
                        media: updatePostDto.media || [],
                    },
                    { new: true }
                )
                .populate({
                    path: 'user',
                    select: 'name imageUrl avatarURL',
                })
                .exec();

            if (!updatedPost) {
                throw new NotFoundException(`Không tìm thấy bài viết với id ${id}`);
            }

            return updatedPost;
        } catch (error) {
            console.error('Error updating post:', error);
            throw new InternalServerErrorException('Lỗi khi cập nhật bài viết');
        }
    }

    async delete(id: string): Promise<{ message: string }> {
        try {
            const result = await this.postModel.findByIdAndDelete(id);
            if (!result) {
                throw new NotFoundException(`Post with id ${id} not found`);
            }

            await this.deleteCache(result.user.toString());
            return { message: `Post with id ${id} deleted successfully` };
        } catch (error) {
            console.error('Error deleting post:', error);
            throw new InternalServerErrorException('Lỗi khi xóa bài viết');
        }
    }
}
