import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Doctor, DoctorSchema } from 'src/schemas/doctor.schema';

@Module({
  imports: [
        MongooseModule.forFeature([
          {name: User.name,schema: UserSchema},
          { name: Doctor.name, schema: DoctorSchema },
        ])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
