import { Module } from '@nestjs/common';
import { PostFavoriteService } from './post-favorite.service';
import { PostFavoriteController } from './post-favorite.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PostFavorite, PostFavoriteSchema } from 'src/schemas/post-favorite.schema';
import { CacheService } from 'src/cache.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PostFavorite.name, schema: PostFavoriteSchema },
    ])],
  controllers: [PostFavoriteController],
  providers: [PostFavoriteService, CacheService],
})
export class PostFavoriteModule { }
