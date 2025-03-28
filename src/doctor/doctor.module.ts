import { Module } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { Doctor, DoctorSchema } from 'src/schemas/doctor.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schema';

import { Appointment, AppointmentSchema } from 'src/schemas/Appointment.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Doctor.name, schema: DoctorSchema }, {name: User.name, schema: UserSchema}, {name: Appointment.name, schema: AppointmentSchema}])],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}
