import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsComment, NewsCommentSchema } from '../schemas/news-comment.schema';
import { News, NewsSchema } from '../schemas/news.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Doctor, DoctorSchema } from '../schemas/doctor.schema';
import { NewsCommentService } from './news-comment.service';
import { NewsCommentController } from './news-comment.controller';
import { Admin, AdminSchema } from 'src/schemas/admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewsComment.name, schema: NewsCommentSchema },
      { name: News.name, schema: NewsSchema },
      { name: User.name, schema: UserSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  controllers: [NewsCommentController],
  providers: [NewsCommentService],
})
export class NewsCommentModule { }
