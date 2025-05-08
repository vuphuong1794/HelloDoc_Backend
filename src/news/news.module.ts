import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { News, NewsSchema } from '../schemas/news.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Doctor, DoctorSchema } from '../schemas/doctor.schema';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { Admin, AdminSchema } from 'src/schemas/admin.schema';

@Module({
  imports: [
    CloudinaryModule,
    MongooseModule.forFeature([
      { name: News.name, schema: NewsSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  controllers: [NewsController],
  providers: [NewsService],
})
export class NewsModule { }
