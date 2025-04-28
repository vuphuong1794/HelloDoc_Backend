import { Injectable, NotFoundException, BadRequestException  } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from 'src/schemas/Post.schema';
import { Model } from 'mongoose';
import { CreatePostDto } from 'src/post/dto/createPost.dto';
import { UpdatePostDto } from 'src/dtos/updatePost.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class PostService {
    constructor(
        @InjectModel(Post.name) private postModel: Model<Post>,
        private cloudinaryService: CloudinaryService,
    ) { }

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

        const createdPost = new this.postModel({
            user: createPostDto.userId,
            content: createPostDto.content,
            imageUrls: uploadedMediaUrls, // lưu các link Cloudinary vào đây
        });

        return createdPost.save();
    }

    async getAll(): Promise<Post[]> {
        return this.postModel
            .find()
            .populate('user', 'name userImage')
            // .populate({
            //     path: 'comments',
            //     populate: { path: 'user', select: 'name imageUrl' }
            // })
            .exec();
    }

    async getOne(id: string): Promise<Post> {
        const post = await this.postModel
            .findById(id)
            .populate('user', 'name userImage');
        // .populate({
        //     path: 'comments',
        //     populate: { path: 'user', select: 'name imageUrl' }
        // })

        if (!post) {
            throw new NotFoundException(`Post with id ${id} not found`);
        }

        return post;
    }

    async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
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
            .populate('user', 'name userImage')
        // .populate({
        //     path: 'comments',
        //     populate: { path: 'user', select: 'name imageUrl' }
        // });

        if (!updatedPost) {
            throw new NotFoundException(`Post with id ${id} not found`);
        }

        return updatedPost;
    }

    async delete(id: string): Promise<any> {
        const result = await this.postModel.findByIdAndDelete(id);
        if (!result) {
            throw new NotFoundException(`Post with id ${id} not found`);
        }
        return { message: `Post with id ${id} deleted successfully` };
    }
}