import { Test, TestingModule } from '@nestjs/testing';
import { NewsCommentService } from './news-comment.service';

describe('NewsCommentService', () => {
  let service: NewsCommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NewsCommentService],
    }).compile();

    service = module.get<NewsCommentService>(NewsCommentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
