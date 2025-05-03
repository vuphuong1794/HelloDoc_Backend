import { Injectable } from '@nestjs/common';
import { User } from '../schemas/user.schema';
import { Doctor } from '../schemas/doctor.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateFcmDto } from './dto/update-fcm.dto';

@Injectable()
export class UserService {
  constructor(
      @InjectModel(User.name) private UserModel: Model<User>,
      @InjectModel(Doctor.name) private DoctorModel: Model<Doctor>,
  ) {}
  
  async updateFcmToken(userId: string, updateFcmDto: UpdateFcmDto) {
    console.log(updateFcmDto.token);
    if (updateFcmDto.userModel == 'User') {
      return this.UserModel.findByIdAndUpdate(
        userId,
        { fcmToken: updateFcmDto.token },
        { new: true }
      );
    } else if (updateFcmDto.userModel == 'Doctor') {
      return this.DoctorModel.findByIdAndUpdate(
        userId,
        { fcmToken: updateFcmDto.token },
        { new: true }
      );
    }
    
  }
}
