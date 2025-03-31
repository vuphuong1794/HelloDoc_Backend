import { Test, TestingModule } from '@nestjs/testing';
import { FaqitemController } from './faqitem.controller';
import { FaqitemService } from './faqitem.service';

describe('FaqitemController', () => {
  let controller: FaqitemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaqitemController],
      providers: [FaqitemService],
    }).compile();

    controller = module.get<FaqitemController>(FaqitemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
