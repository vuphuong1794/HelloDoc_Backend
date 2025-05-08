import { Test, TestingModule } from '@nestjs/testing';
import { NewsFavoriteService } from './news-favorite.service';

describe('NewsFavoriteService', () => {
  let service: NewsFavoriteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NewsFavoriteService],
    }).compile();

    service = module.get<NewsFavoriteService>(NewsFavoriteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
