import { PartialType } from '@nestjs/mapped-types';
import { CreateRemoteMedicalOptionDto } from './create-remote-medical-option.dto';

export class UpdateRemoteMedicalOptionDto extends PartialType(CreateRemoteMedicalOptionDto) {}
