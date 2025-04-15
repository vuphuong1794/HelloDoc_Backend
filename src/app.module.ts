import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { DoctorModule } from './doctor/doctor.module';
import { AppointmentModule } from './appointment/appointment.module';
import { SpecialtyModule } from './specialty/specialty.module';
import { MedicalOptionModule } from './medical-option/medical-option.module';
import { RemoteMedicalOptionModule } from './remote-medical-option/remote-medical-option.module';
import { FaqitemModule } from './faqitem/faqitem.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
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
    AppointmentModule,
    SpecialtyModule,
    MedicalOptionModule,
    RemoteMedicalOptionModule,
    FaqitemModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}