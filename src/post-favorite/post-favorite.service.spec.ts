import { Test, TestingModule } from '@nestjs/testing';
import { PostFavoriteService } from './post-favorite.service';

describe('PostFavoriteService', () => {
  let service: PostFavoriteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostFavoriteService],
    }).compile();

    service = module.get<PostFavoriteService>(PostFavoriteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
