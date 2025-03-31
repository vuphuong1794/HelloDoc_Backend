import { Module } from '@nestjs/common';
import { RemoteMedicalOptionService } from './remote-medical-option.service';
import { RemoteMedicalOptionController } from './remote-medical-option.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RemoteMedicalOption, RemoteMedicalOptionSchema } from 'src/schemas/remote-medical-option.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: RemoteMedicalOption.name, schema: RemoteMedicalOptionSchema }])],
  controllers: [RemoteMedicalOptionController],
  providers: [RemoteMedicalOptionService],
})
export class RemoteMedicalOptionModule {}
