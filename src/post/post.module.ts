import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from 'src/schemas/Post.schema';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Doctor, DoctorSchema } from 'src/schemas/doctor.schema';
import { CacheService } from 'src/cache.service';

@Module({
  imports: [
    CloudinaryModule,
    MongooseModule.forFeature([
      {
        name: Post.name,
        schema: PostSchema
      },
      { name: User.name, schema: UserSchema },
      { name: Doctor.name, schema: DoctorSchema }

    ])],
  controllers: [PostController],
  providers: [PostService, CacheService],
})
export class PostModule { }
