import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from '../dtos/signup.dto';
import { User } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { loginDto } from '../dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Admin } from 'src/schemas/admin.schema';
import { Doctor } from 'src/schemas/doctor.schema';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from 'src/cache.service';


@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(Admin.name) private AdminModel: Model<Admin>,
    @InjectModel(Doctor.name) private DoctorModel: Model<Doctor>,
    private configService: ConfigService,
    private jwtService: JwtService,
    private cacheService: CacheService,
  ) { }

  async signUp(signUpData: SignupDto) {
    const { email, password, name, phone } = signUpData;
    const emailInUse = await this.UserModel.findOne({ email });
    if (emailInUse) {
      throw new BadRequestException('Email already in use');
    }

    const phoneInUse = await this.UserModel.findOne({ phone });
    if (phoneInUse) {
      throw new BadRequestException('Phone number already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10); // hash password

    await this.UserModel.create({
      email,
      password: hashedPassword,
      name,
      phone,
    });
    return {
      message: 'User created successfully',
    };
  }


  async login(LoginData: loginDto) {
    const { email, password } = LoginData;
    let user = await this.UserModel.findOne({ email });

    if (!user) {
      user = await this.AdminModel.findOne({ email });
    }

    if (!user) {
      user = await this.DoctorModel.findOne({ email });
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Password is incorrect');
    }

    // Generate JWT token
    const tokens = await this.generateUserTokens(user._id, user.email, user.name, user.phone, user.address, user.role);

    // Cache the user data temporarily (for example, 1 hour)
    const cacheKey = `user_${user._id}`;
    await this.cacheService.setCache(cacheKey, { userId: user._id, name: user.name, email: user.email }, 3600 * 1000); // 1 hour

    const userCache = await this.cacheService.getCache(`user_${user._id}`);
    if (userCache) {
      console.log("user cache", userCache); // { userId, name, email }
    }

    return {
      accessToken: tokens.accessToken,
      message: 'Login successful',
    };
  }

  async generateUserTokens(userId, email, name, phone, address, role) {
    const accessToken = this.jwtService.sign(
      { userId, email, name, phone, address, role },
    );
    return {
      accessToken,
    };
  }
}
