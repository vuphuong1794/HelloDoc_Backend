import { Test, TestingModule } from '@nestjs/testing';
import { RemoteMedicalOptionService } from './remote-medical-option.service';

describe('RemoteMedicalOptionService', () => {
  let service: RemoteMedicalOptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RemoteMedicalOptionService],
    }).compile();

    service = module.get<RemoteMedicalOptionService>(RemoteMedicalOptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
