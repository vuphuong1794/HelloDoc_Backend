import { PartialType } from '@nestjs/mapped-types';
import { CreateFaqitemDto } from './create-faqitem.dto';

export class UpdateFaqitemDto extends PartialType(CreateFaqitemDto) {}
