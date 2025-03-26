import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';
import { Doctor, DoctorSchema } from 'src/schemas/doctor.schema';
import { Admin, AdminSchema } from 'src/schemas/admin.schema';

@Module({
  imports: [MongooseModule.forFeature([{
    name: User.name,
    schema: UserSchema,
  },
  {
    name: Doctor.name,
    schema: DoctorSchema,
  },
  {
    name: Admin.name,
    schema: AdminSchema,
  }
])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
