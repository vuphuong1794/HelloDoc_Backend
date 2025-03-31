import { Test, TestingModule } from '@nestjs/testing';
import { RemoteMedicalOptionController } from './remote-medical-option.controller';
import { RemoteMedicalOptionService } from './remote-medical-option.service';

describe('RemoteMedicalOptionController', () => {
  let controller: RemoteMedicalOptionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RemoteMedicalOptionController],
      providers: [RemoteMedicalOptionService],
    }).compile();

    controller = module.get<RemoteMedicalOptionController>(RemoteMedicalOptionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
