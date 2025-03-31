import { Test, TestingModule } from '@nestjs/testing';
import { MedicalOptionService } from './medical-option.service';

describe('MedicalOptionService', () => {
  let service: MedicalOptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicalOptionService],
    }).compile();

    service = module.get<MedicalOptionService>(MedicalOptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
