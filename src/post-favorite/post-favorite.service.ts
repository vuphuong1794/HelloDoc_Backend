import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostFavorite } from 'src/schemas/post-favorite.schema';
import { Model } from 'mongoose';
import { CreatePostFavoriteDto } from './dto/create-post-favorite.dto';
import { GetPostFavoriteDto } from './dto/get-post-favorite.dto';

@Injectable()
export class PostFavoriteService {
  constructor(
    @InjectModel(PostFavorite.name) private postFavoriteModel: Model<PostFavorite>,
  ) { }

  async getPostFavoritesByPostId(postId: string, getPostFavoriteDto: GetPostFavoriteDto) {
    const postFavorite = await this.postFavoriteModel.findOne({
      user: getPostFavoriteDto.userId,
      post: postId,
    });
    const totalFavorites = await this.postFavoriteModel.countDocuments({ post: postId });
    if (postFavorite) {
      // Nếu đã like thì trả trạng thái đã like
      return { isFavorited: true, totalFavorites };
    } else {
      // Nếu chưa like thì trả trạng thái chưa like
      return { isFavorited: false, totalFavorites };
    }
  }

  async updatePostFavoriteByPostId(postId: string, createPostFavoriteDto: CreatePostFavoriteDto) {
    try {
      const postFavorite = await this.postFavoriteModel.findOne({
        user: createPostFavoriteDto.userId,
        post: postId,
      });

      if (postFavorite) {
        // Nếu đã like trước đó, thì unlike (xóa document)
        await this.postFavoriteModel.deleteOne({ _id: postFavorite._id });
        const totalFavorites = await this.postFavoriteModel.countDocuments({ post: postId });
        return { isFavorited: false, totalFavorites };
      } else {
        // Nếu chưa like, thì tạo mới
        await this.postFavoriteModel.create({
          user: createPostFavoriteDto.userId,
          userModel: createPostFavoriteDto.userModel,
          post: postId,
        });
        const totalFavorites = await this.postFavoriteModel.countDocuments({ post: postId });
        return { isFavorited: true, totalFavorites };
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật favorite:', error);
      throw new InternalServerErrorException('Không thể cập nhật trạng thái yêu thích');
    }
  }

  async getPostFavoritesByUserId(userId: string) {
    try {
      const postFavorites = await this.postFavoriteModel.find({ user: userId })
        .populate({
          path: 'post',
          select: 'media content',
        })
        .populate({
          path: 'user',
          select: 'name avatarURL'
        })
        .exec();
      return postFavorites;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bình luận:', error);
      throw new InternalServerErrorException('Không thể lấy danh sách bình luận');
    }
  }

}
