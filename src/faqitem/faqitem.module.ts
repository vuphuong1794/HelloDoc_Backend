import { Module } from '@nestjs/common';
import { FaqitemService } from './faqitem.service';
import { FaqitemController } from './faqitem.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FAQItem, FAQItemSchema } from 'src/schemas/faqitem.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: FAQItem.name, schema: FAQItemSchema }])],
  controllers: [FaqitemController],
  providers: [FaqitemService],
})
export class FaqitemModule {}
