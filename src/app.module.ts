import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { DoctorModule } from './doctor/doctor.module';
import { AppointmentModule } from './appointment/appointment.module';
import { SpecialtyModule } from './specialty/specialty.module';
import { MedicalOptionModule } from './medical-option/medical-option.module';
import { RemoteMedicalOptionModule } from './remote-medical-option/remote-medical-option.module';
import { FaqitemModule } from './faqitem/faqitem.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { PostModule } from './post/post.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ReviewModule } from './review/review.module';
import config from './config/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [config],
    }),
    JwtModule.register({ global: true, secret: "secretKey" }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    AdminModule,
    AuthModule,
    DoctorModule,
    AppointmentModule,
    SpecialtyModule,
    MedicalOptionModule,
    RemoteMedicalOptionModule,
    FaqitemModule,
    CloudinaryModule,
    PostModule,
    FirebaseModule,
    PostModule,
    ReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }