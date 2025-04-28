import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from 'src/schemas/Post.schema';
import { Model } from 'mongoose';
import { CreatePostDto } from 'src/dtos/createPost.dto';
import { UpdatePostDto } from 'src/dtos/updatePost.dto';
import { Doctor } from 'src/schemas/doctor.schema';
import { User } from 'src/schemas/user.schema';

@Injectable()
export class PostService {

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
        @InjectModel(Post.name) private postModel: Model<Post>,
    ) {}

    private async findOwnerById(ownerId: string): Promise<User | Doctor> {
        const owner = await this.userModel.findById(ownerId).lean() 
                   || await this.doctorModel.findById(ownerId).lean();

        if (!owner) {
            throw new NotFoundException(`Owner with id ${ownerId} not found`);
        }
        return owner;
    }

    async create(createPostDto: CreatePostDto): Promise<Post> {
        const createdPost = new this.postModel({
            user: createPostDto.userId,
            content: createPostDto.content,
            media: createPostDto.media || [],
        });
        return createdPost.save();
    }

    async getAll(): Promise<Post[]> {
        return this.postModel
            .find()
            .populate({
                path: 'user',
                select: 'name imageUrl avatarURL', // Chỉ cần viết 1 lần, nếu sau này User và Doctor khác nhau thì chỉnh chỗ này
            })
            .exec();
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

    async getById(ownerId: string): Promise<Post[]> {
        await this.findOwnerById(ownerId);  // Đảm bảo owner tồn tại

        const posts = await this.postModel
            .find({ user: ownerId })
            .populate({
                path: 'user',
                select: 'name imageUrl avatarURL',
            })
            .exec();

        return posts;
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
            .populate({
                path: 'user',
                select: 'name imageUrl avatarURL',
            })
            .exec();

        if (!updatedPost) {
            throw new NotFoundException(`Post with id ${id} not found`);
        }
        return updatedPost;
    }

    async delete(id: string): Promise<{ message: string }> {
        const result = await this.postModel.findByIdAndDelete(id);
        if (!result) {
            throw new NotFoundException(`Post with id ${id} not found`);
        }
        return { message: `Post with id ${id} deleted successfully` };
    }
}
