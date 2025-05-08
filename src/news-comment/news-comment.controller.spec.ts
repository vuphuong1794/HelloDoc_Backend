import { Test, TestingModule } from '@nestjs/testing';
import { NewsCommentController } from './news-comment.controller';
import { NewsCommentService } from './news-comment.service';

describe('NewsCommentController', () => {
  let controller: NewsCommentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsCommentController],
      providers: [NewsCommentService],
    }).compile();

    controller = module.get<NewsCommentController>(NewsCommentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
