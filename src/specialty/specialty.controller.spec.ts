/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { SpecialtyController } from './specialty.controller';
import { SpecialtyService } from './specialty.service';

describe('SpecialtyController', () => {
  let controller: SpecialtyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpecialtyController],
      providers: [SpecialtyService],
    }).compile();

    controller = module.get<SpecialtyController>(SpecialtyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
