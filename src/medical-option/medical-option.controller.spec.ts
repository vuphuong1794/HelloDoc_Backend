import { Test, TestingModule } from '@nestjs/testing';
import { MedicalOptionController } from './medical-option.controller';
import { MedicalOptionService } from './medical-option.service';

describe('MedicalOptionController', () => {
  let controller: MedicalOptionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicalOptionController],
      providers: [MedicalOptionService],
    }).compile();

    controller = module.get<MedicalOptionController>(MedicalOptionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
