import { Injectable } from '@nestjs/common';
import { CreatePostFavoriteDto } from './dto/create-post-favorite.dto';
import { UpdatePostFavoriteDto } from './dto/update-post-favorite.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PostFavorite } from 'src/schemas/post-favorite.schema';
import { Model } from 'mongoose';

@Injectable()
export class PostFavoriteService {
  constructor(
            @InjectModel(PostFavorite.name) private postFavoriteModel: Model<PostFavorite>,
        ) { }

  create(createPostFavoriteDto: CreatePostFavoriteDto) {
    const createdPostFavorite = new this.postFavoriteModel({
        user: createPostFavoriteDto.userId,
        userModel: createPostFavoriteDto.userModel,
        post: createPostFavoriteDto.postId,
    });

    return createdPostFavorite.save();
  }

  findAll() {
    return `This action returns all postFavorite`;
  }

  findOne(id: number) {
    return `This action returns a #${id} postFavorite`;
  }

  update(id: number, updatePostFavoriteDto: UpdatePostFavoriteDto) {
    return `This action updates a #${id} postFavorite`;
  }

  remove(id: number) {
    return `This action removes a #${id} postFavorite`;
  }
}
