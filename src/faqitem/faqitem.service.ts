import { CreateFaqitemDto } from './dto/create-faqitem.dto';
import { UpdateFaqitemDto } from './dto/update-faqitem.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FAQItem } from 'src/schemas/faqitem.schema';

@Injectable()
export class FaqitemService {
  constructor(
      @InjectModel(FAQItem.name) private FaqitemModel: Model<FAQItem>,
    ) {}

  async getFaqitems() {
    return await this.FaqitemModel.find();
  }

  create(createFaqitemDto: CreateFaqitemDto) {
    return 'This action adds a new faqitem';
  }

  findAll() {
    return `This action returns all faqitem`;
  }

  findOne(id: number) {
    return `This action returns a #${id} faqitem`;
  }

  update(id: number, updateFaqitemDto: UpdateFaqitemDto) {
    return `This action updates a #${id} faqitem`;
  }

  remove(id: number) {
    return `This action removes a #${id} faqitem`;
  }
}
