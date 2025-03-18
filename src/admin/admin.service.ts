import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/shcemas/user.schema';

@Injectable()
export class AdminService {
    constructor(@InjectModel(User.name) private UserModel: Model<User>){}
    async getUsers() {
        const userList = await this.UserModel.find();
        return userList;
    }
}
