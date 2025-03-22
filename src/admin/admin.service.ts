import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { Admin } from 'src/schemas/admin.schema';
import { SignupDto } from '../dtos/signup.dto';
import * as bcrypt from 'bcrypt';
import { updateUserDto } from 'src/dtos/updateUser.dto';
import { Model, isValidObjectId, Types } from 'mongoose';

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

    async updateUser(id: string, updateData: updateUserDto) {
        const { email, password, name, phone } = updateData;
      
        // Validate ObjectId format
        if (!isValidObjectId(id)) {
          throw new BadRequestException('Invalid ID format');
        }
        // Convert id to ObjectId
        const objectId = new Types.ObjectId(id);
        // Check if the user exists by id
        const user = await this.UserModel.findById(objectId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
      
        // Hash the new password if provided
        const hashedPassword = password
          ? await bcrypt.hash(password, 10)
          : user.password;
      
        // Update user data
        await this.UserModel.findByIdAndUpdate(
            objectId,
            {
                $set: {
                email: email || user.email,
                name: name || user.name,
                phone: phone || user.phone,
                password: hashedPassword,
                },
            },
            { new: true } // Return the updated document
        );
        return { message: 'User updated successfully' };
    }
}
