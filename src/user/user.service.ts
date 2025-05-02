import { Injectable } from '@nestjs/common';
import { User } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UserService {
  constructor(
      @InjectModel(User.name) private UserModel: Model<User>,
  ) {}
  
  async updateFcmToken(userId: string, token: string) {
    console.log(token);
    return this.UserModel.findByIdAndUpdate(
      userId,
      { fcmToken: token },
      { new: true }
    );
  }
}
