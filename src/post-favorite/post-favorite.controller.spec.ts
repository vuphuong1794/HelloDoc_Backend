import { Test, TestingModule } from '@nestjs/testing';
import { PostFavoriteController } from './post-favorite.controller';
import { PostFavoriteService } from './post-favorite.service';

describe('PostFavoriteController', () => {
  let controller: PostFavoriteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostFavoriteController],
      providers: [PostFavoriteService],
    }).compile();

    controller = module.get<PostFavoriteController>(PostFavoriteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
