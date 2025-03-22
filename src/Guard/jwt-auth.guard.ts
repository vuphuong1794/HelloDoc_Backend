import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Lấy token từ headers với key 'accessToken'
    const token = request.headers['accesstoken'] as string; 

    if (!token) {
      throw new UnauthorizedException('Bạn chưa đăng nhập');
    }

    try {
      const decoded = this.jwtService.verify(token);
      (request as any).user = decoded; // Gán user vào request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }
}
