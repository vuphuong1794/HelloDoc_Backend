import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Sign } from 'crypto';
import { SignupDto } from '../dtos/signup.dto';
import { loginDto } from '../dtos/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpData: SignupDto) {
    return this.authService.signUp(signUpData);
  }

  @Post('login')
  async login(@Body() credentials: loginDto) {
    return this.authService.login(credentials);
  }
}
