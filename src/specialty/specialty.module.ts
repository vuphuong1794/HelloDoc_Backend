import { Module } from '@nestjs/common';
import { SpecialtyService } from './specialty.service';
import { SpecialtyController } from './specialty.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Specialty, SpecialtySchema } from 'src/schemas/specialty.schema';
import { Doctor, DoctorSchema } from 'src/schemas/doctor.schema';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CacheService } from 'src/cache.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Specialty.name, schema: SpecialtySchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
  ],
  controllers: [SpecialtyController],
  providers: [SpecialtyService, CloudinaryService, CacheService],
})
export class SpecialtyModule { }
