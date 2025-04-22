import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from 'src/schemas/Post.schema';
import { Model } from 'mongoose';
import { CreatePostDto } from 'src/dtos/createPost.dto';
import { UpdatePostDto } from 'src/dtos/updatePost.dto';

@Injectable()
export class PostService {
    constructor(@InjectModel(Post.name) private postModel: Model<Post>) { }

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
            .populate('user', 'name imageUrl')
            // .populate({
            //     path: 'comments',
            //     populate: { path: 'user', select: 'name imageUrl' }
            // })
            .exec();
    }

    async getOne(id: string): Promise<Post> {
        const post = await this.postModel
            .findById(id)
            .populate('user', 'name imageUrl');
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
            .populate('user', 'name imageUrl')
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