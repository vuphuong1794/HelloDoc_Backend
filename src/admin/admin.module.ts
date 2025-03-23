import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Admin, AdminSchema } from 'src/schemas/admin.schema';
import { Doctor, DoctorSchema } from 'src/schemas/doctor.schema';


@Module({
  imports: [MongooseModule.forFeature([{
    name: User.name,
    schema: UserSchema,
  },
  {
    name: Admin.name,
    schema: AdminSchema,
  },
  {
    name: Doctor.name,
    schema: DoctorSchema,
  }

])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
