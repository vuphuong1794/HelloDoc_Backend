import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from 'src/schemas/Appointment.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Doctor, DoctorSchema } from 'src/schemas/doctor.schema';
import { CacheService } from 'src/cache.service';
import { Review, ReviewSchema } from 'src/schemas/review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService, CacheService],
})
export class AppointmentModule { }
