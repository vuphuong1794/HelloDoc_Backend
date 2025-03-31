import { Test, TestingModule } from '@nestjs/testing';
import { FaqitemService } from './faqitem.service';

describe('FaqitemService', () => {
  let service: FaqitemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FaqitemService],
    }).compile();

    service = module.get<FaqitemService>(FaqitemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
