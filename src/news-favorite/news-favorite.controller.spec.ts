import { Test, TestingModule } from '@nestjs/testing';
import { NewsFavoriteController } from './news-favorite.controller';
import { NewsFavoriteService } from './news-favorite.service';

describe('NewsFavoriteController', () => {
  let controller: NewsFavoriteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsFavoriteController],
      providers: [NewsFavoriteService],
    }).compile();

    controller = module.get<NewsFavoriteController>(NewsFavoriteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
