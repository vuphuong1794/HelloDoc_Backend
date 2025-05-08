import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsFavoriteController } from './news-favorite.controller';
import { NewsFavoriteService } from './news-favorite.service';
import { NewsFavorite, NewsFavoriteSchema } from '../schemas/news-favorite.schema';
import { News, NewsSchema } from '../schemas/news.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Doctor, DoctorSchema } from '../schemas/doctor.schema';
import { Admin, AdminSchema } from 'src/schemas/admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewsFavorite.name, schema: NewsFavoriteSchema },
      { name: News.name, schema: NewsSchema },
      { name: User.name, schema: UserSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  controllers: [NewsFavoriteController],
  providers: [NewsFavoriteService],
})
export class NewsFavoriteModule { }
