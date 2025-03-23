import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            throw new BadRequestException('Invalid ID format');
        }
        
        // Convert id to ObjectId
        const objectId = new Types.ObjectId(id);
    
        // Check if the user exists
        const user = await this.UserModel.findById(objectId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
    
        // Prepare the update object
        const updateFields: Partial<updateUserDto> = {}; //Chỉ gửi lên các trường thực sự có thay đổi
    
        if (updateData.email) updateFields.email = updateData.email;
        if (updateData.name) updateFields.name = updateData.name;
        if (updateData.phone) updateFields.phone = updateData.phone;
        if (updateData.password) {
            updateFields.password = await bcrypt.hash(updateData.password, 10);
        }
    
        // If no fields to update, return unchanged user
        if (Object.keys(updateFields).length === 0) {
            return { message: 'No changes detected' };
        }
    
        // Update user and return the updated document
        const updatedUser = await this.UserModel.findByIdAndUpdate(
            objectId,
            { $set: updateFields },
            { new: true, select: '-password' } // Hide password
        );
    
        if (!updatedUser) {
            throw new NotFoundException('Update failed, user not found');
        }
    
        return { message: 'User updated successfully', user: updatedUser };
    }
    
}
