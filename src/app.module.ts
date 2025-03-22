import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { DoctorModule } from './doctor/doctor.module';
import config from './config/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [config],
    }),
    JwtModule.register({global: true, secret: "secretKey"}),
    MongooseModule.forRoot(
      'mongodb+srv://pvunguyen84:nQ0ZjjFTjKnLvuwa@cluster0.lk7ml.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    ),
    AdminModule,
    AuthModule,
    DoctorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
