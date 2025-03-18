import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/shcemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{
    name: User.name,
    schema: UserSchema,
  }])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
