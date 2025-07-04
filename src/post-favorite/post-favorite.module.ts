import { Module } from '@nestjs/common';
import { PostFavoriteService } from './post-favorite.service';
import { PostFavoriteController } from './post-favorite.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PostFavorite, PostFavoriteSchema } from 'src/schemas/post-favorite.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Doctor, DoctorSchema } from 'src/schemas/doctor.schema';
import { Post, PostSchema } from 'src/schemas/Post.schema';
import { CacheService } from 'src/cache.service';
import { Notification, NotificationSchema } from 'src/schemas/notification.schema';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PostFavorite.name, schema: PostFavoriteSchema },
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Notification.name, schema: NotificationSchema } 
    ])],
  controllers: [PostFavoriteController],
  providers: [PostFavoriteService, CacheService, NotificationService],
})
export class PostFavoriteModule { }
