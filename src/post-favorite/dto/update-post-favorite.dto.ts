import { PartialType } from '@nestjs/mapped-types';
import { CreatePostFavoriteDto } from './create-post-favorite.dto';

export class UpdatePostFavoriteDto extends PartialType(CreatePostFavoriteDto) {}
