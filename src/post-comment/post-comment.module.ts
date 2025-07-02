import { Module } from '@nestjs/common';
import { PostCommentService } from './post-comment.service';
import { PostCommentController } from './post-comment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PostComment, PostCommentSchema } from 'src/schemas/post-comment.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Doctor, DoctorSchema } from 'src/schemas/doctor.schema';
import { Post, PostSchema } from 'src/schemas/Post.schema';
import { CacheService } from 'src/cache.service';
import { Notification, NotificationSchema } from 'src/schemas/notification.schema';
import { NotificationService } from 'src/notification/notification.service';
import { CreateNotificationDto } from 'src/notification/dto/create-notification.dto';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PostComment.name, schema: PostCommentSchema },
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
      { name: Doctor.name, schema: DoctorSchema },
      {name: Notification.name, schema: NotificationSchema} // Assuming Notification schema is similar to PostComment
    ])],
  controllers: [PostCommentController],
  providers: [
    PostCommentService, 
    CacheService, 
    NotificationService
  ],
})
export class PostCommentModule { }
