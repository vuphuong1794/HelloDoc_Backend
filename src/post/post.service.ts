import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
        const owner = await this.userModel.findById(ownerId).lean()
            || await this.doctorModel.findById(ownerId).lean();

        if (!owner) {
            throw new NotFoundException(`Owner with id ${ownerId} not found`);
        }
        return owner;
    }

    async create(createPostDto: CreatePostDto): Promise<Post> {
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
            media: uploadedMediaUrls, // lưu các link Cloudinary vào đây
        });

        //xóa cache posts của owner
        await this.deleteCache(createPostDto.userId);

        return createdPost.save();
    }

    async getAll(): Promise<Post[]> {
        const cacheKey = 'all_posts';
        console.log('Trying to get from cache...');

        const cached = await this.cacheService.getCache(cacheKey);
        if (cached) {
            console.log('Cache HIT');
            return cached;
        }

        console.log('Cache MISS - querying DB');
        const data = await this.postModel
            .find({ $or: [{ isHidden: false }, { isHidden: { $exists: false } }] })
            .sort({ createdAt: -1 })
            .populate({
                path: 'user',
                select: 'name imageUrl avatarURL', // Chỉ cần viết 1 lần, nếu sau này User và Doctor khác nhau thì chỉnh chỗ này
            })
            .exec();

        console.log('Setting cache...');
        await this.cacheService.setCache(cacheKey, data, 30 * 1000);
        return data;
    }

    async getOne(id: string): Promise<Post> {
        const post = await this.postModel
            .findById(id)
            .populate({
                path: 'user',
                select: 'name imageUrl avatarURL',
            })
            .exec();

        if (!post) {
            throw new NotFoundException(`Post with id ${id} not found`);
        }
        return post;
    }

    //xóa cache posts của owner 
    async deleteCache(ownerId: string) {
        const cacheKey = `posts_by_owner_${ownerId}`;
        await this.cacheService.deleteCache(cacheKey);
    }

    async getById(ownerId: string): Promise<Post[]> {
        await this.findOwnerById(ownerId);  // Đảm bảo owner tồn tại

        const cacheKey = 'posts_by_owner';
        console.log('Trying to get user posts from cache...');

        const cached = await this.cacheService.getCache(cacheKey);
        if (cached) {
            console.log('Cache HIT');
            return cached;
        }

        console.log('Cache MISS - querying DB');
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

        console.log('Setting cache...');
        await this.cacheService.setCache(cacheKey, posts, 30 * 1000);
        return posts;
    }

    async update(id: string, updatePostDto: UpdatePostDto) {
        const existingPost = await this.postModel.findById(id);
        if (!existingPost) throw new NotFoundException('Post not found');

        const uploadedMediaUrls: string[] = [];

        const images = updatePostDto.images as Express.Multer.File[];

        if (images && images.length > 0) {
            for (const file of images) {
                const uploadResult = await this.cloudinaryService.uploadFile(file, `Posts/${existingPost.user}`);
                uploadedMediaUrls.push(uploadResult.secure_url);
            }
            existingPost.media = uploadedMediaUrls; // cập nhật ảnh mới
        } else if (updatePostDto.media && updatePostDto.media.length > 0) {
            //Nếu có gửi lại danh sách media cũ → giữ nguyên
            existingPost.media = updatePostDto.media;
        } else {

        }

        if (updatePostDto.content) {
            existingPost.content = updatePostDto.content;
        }
        const all_posts = 'posts_by_owner';
        await this.cacheService.deleteCache(all_posts);

        return await existingPost.save();
    }



    async delete(id: string): Promise<{ message: string }> {
        const updated = await this.postModel.findByIdAndUpdate(
            id,
            { isHidden: true },
            { new: true }
        );
        if (!updated) {
            throw new NotFoundException(`Post with id ${id} not found`);
        }
        await this.deleteCache(updated.user.toString());
        return { message: `Post with id ${id} deleted successfully` };
    }
}
