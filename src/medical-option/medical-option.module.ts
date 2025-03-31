import { Module } from '@nestjs/common';
import { MedicalOptionService } from './medical-option.service';
import { MedicalOptionController } from './medical-option.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalOption, MedicalOptionSchema } from 'src/schemas/medical-option.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: MedicalOption.name, schema: MedicalOptionSchema }])],
  controllers: [MedicalOptionController],
  providers: [MedicalOptionService],
})
export class MedicalOptionModule {}
