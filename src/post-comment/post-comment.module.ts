import { Module } from '@nestjs/common';
import { PostCommentService } from './post-comment.service';
import { PostCommentController } from './post-comment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PostComment, PostCommentSchema } from 'src/schemas/post-comment.schema';

@Module({
  imports: [
      MongooseModule.forFeature([
        {name: PostComment.name,schema: PostCommentSchema},
      ])],
  controllers: [PostCommentController],
  providers: [PostCommentService],
})
export class PostCommentModule {}
