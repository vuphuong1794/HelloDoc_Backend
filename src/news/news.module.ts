import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { News, NewsSchema } from '../schemas/news.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Doctor, DoctorSchema } from '../schemas/doctor.schema';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    CloudinaryModule,
    MongooseModule.forFeature([
      { name: News.name, schema: NewsSchema },
      { name: User.name, schema: UserSchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
  ],
  controllers: [NewsController],
  providers: [NewsService],
})
export class NewsModule { }
