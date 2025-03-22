import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { Admin } from 'src/schemas/admin.schema';
import { SignupDto } from '../dtos/signup.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AdminService {
    constructor(
        @InjectModel(User.name) private UserModel: Model<User>,
        @InjectModel(Admin.name) private AdminModel: Model<Admin>
    ) {}

    async getUsers() {
        return await this.UserModel.find();
    }

    async postAdmin(signUpData: SignupDto) {
        const { email, password, name, phone } = signUpData;

        const emailInUse = await this.AdminModel.findOne({ email });
        if (emailInUse) {
            throw new BadRequestException('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await this.AdminModel.create({
            email,
            password: hashedPassword,
            name,
            phone
        });

        return { message: 'Admin created successfully' };
    }
}
