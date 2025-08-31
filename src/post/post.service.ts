// src/post/post.service.ts
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from 'src/schemas/Post.schema';
import { Model } from 'mongoose';
import { CreatePostDto } from 'src/post/dto/createPost.dto';
import { UpdatePostDto } from 'src/post/dto/updatePost.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Doctor } from 'src/schemas/doctor.schema';
import { User } from 'src/schemas/user.schema';
import { CacheService } from 'src/cache.service';
import { Express } from 'express';
import { EmbeddingService } from 'src/embedding/embedding.service';
import { VectorSearchService } from 'src/vector-db/vector-db.service';

@Injectable()
export class PostService {
    private readonly logger = new Logger(PostService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
        @InjectModel(Post.name) private postModel: Model<Post>,
        private cloudinaryService: CloudinaryService,
        private cacheService: CacheService,
        private embeddingService: EmbeddingService,
        private vectorSearchService: VectorSearchService,
    ) { }

    private async findOwnerById(ownerId: string): Promise<User | Doctor> {
        try {
            const owner = await this.userModel.findById(ownerId).lean() ||
                await this.doctorModel.findById(ownerId).lean();

            if (!owner) {
                throw new NotFoundException(`Không tìm thấy người dùng với id ${ownerId}`);
            }
            return owner;
        } catch (error) {
            this.logger.error(`Error finding owner: ${error.message}`);
            throw new InternalServerErrorException('Lỗi khi tìm người dùng');
        }
    }

    async create(createPostDto: CreatePostDto): Promise<Post> {
        try {
            this.logger.log(`Creating post for user: ${createPostDto.userId}`);

            const uploadedMediaUrls: string[] = [];

            // Upload images if provided
            if (createPostDto.images && createPostDto.images.length > 0) {
                for (const file of createPostDto.images) {
                    try {
                        const uploadResult = await this.cloudinaryService.uploadFile(
                            file,
                            `Posts/${createPostDto.userId}`
                        );
                        uploadedMediaUrls.push(uploadResult.secure_url);
                        this.logger.log(`Ảnh đã tải lên Cloudinary: ${uploadResult.secure_url}`);
                    } catch (error) {
                        this.logger.error('Lỗi Cloudinary khi upload media:', error);
                        throw new BadRequestException('Lỗi khi tải media lên Cloudinary');
                    }
                }
            }

            // Create post data object - KHÔNG tạo embedding ngay
            const postData = {
                user: createPostDto.userId,
                userModel: createPostDto.userModel,
                content: createPostDto.content,
                media: uploadedMediaUrls,
                keywords: createPostDto.keywords || '',
                isHidden: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                // KHÔNG khởi tạo embedding fields
            };

            // Create and save the post
            const createdPost = new this.postModel(postData);
            const savedPost = await createdPost.save();

            this.logger.log(`Post saved to database with ID: ${savedPost._id}`);

            // Verify post exists immediately after save
            const verificationPost = await this.postModel.findById(savedPost._id).lean();
            if (!verificationPost) {
                this.logger.error(`Post ${savedPost._id} not found immediately after save!`);
                throw new Error('Post was not saved properly');
            }

            this.logger.log(`Post verification successful: ${savedPost._id}`);

            // Schedule embedding generation for much later (30 seconds)
            // This completely separates embedding from post creation
            this.scheduleEmbeddingGeneration(savedPost._id.toString(), savedPost.content, savedPost.keywords);

            return savedPost;
        } catch (error) {
            this.logger.error('Error creating post:', error);
            throw new InternalServerErrorException(`Lỗi khi tạo bài viết: ${error.message}`);
        }
    }

    // Schedule embedding generation for later - completely separated from post creation
    private scheduleEmbeddingGeneration(postId: string, content: string, keywords?: string): void {
        // Wait 30 seconds before trying to generate embedding
        setTimeout(async () => {
            try {
                this.logger.log(`Starting scheduled embedding generation for post: ${postId}`);

                // Double-check post still exists
                const post = await this.postModel.findById(postId).select('_id content keywords embedding').lean();
                if (!post) {
                    this.logger.warn(`Post ${postId} not found during scheduled embedding generation`);
                    return;
                }

                // Skip if embedding already exists
                if (post.embedding && Array.isArray(post.embedding) && post.embedding.length > 0) {
                    this.logger.log(`Post ${postId} already has embedding, skipping scheduled generation`);
                    return;
                }

                await this.safeGenerateEmbedding(postId, content, keywords);
            } catch (error) {
                this.logger.error(`Scheduled embedding generation failed for post ${postId}: ${error.message}`);
                // Don't rethrow - this should never affect the main post
            }
        }, 30000); // 30 seconds delay
    }

    // Ultra-safe embedding generation that will NEVER affect the original post
    private async safeGenerateEmbedding(postId: string, content: string, keywords?: string): Promise<void> {
        try {
            const textForEmbedding = `${content} ${keywords || ''}`.trim();

            if (!textForEmbedding || textForEmbedding.length === 0) {
                this.logger.log(`No content for embedding generation for post ${postId}`);
                return;
            }

            this.logger.log(`Generating embedding for post ${postId} with content length: ${textForEmbedding.length}`);

            // Generate embedding
            const embedding = await this.embeddingService.generateEmbedding(textForEmbedding);

            if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
                this.logger.warn(`Invalid embedding generated for post ${postId}`);
                return;
            }

            // Use the safest possible update method
            const updateResult = await this.postModel.findByIdAndUpdate(
                postId,
                {
                    $set: {
                        embedding: embedding,
                        embeddingModel: this.embeddingService.getModelName(),
                        embeddingUpdatedAt: new Date(),
                    }
                },
                {
                    new: false, // Don't return the updated document
                    lean: true, // Use lean for better performance
                    upsert: false, // Never create if not exists
                }
            ).select('_id').lean(); // Only select _id to minimize data transfer

            if (updateResult) {
                this.logger.log(`Successfully added embedding to post ${postId}`);
            } else {
                this.logger.warn(`Post ${postId} not found during embedding update`);
            }

        } catch (error) {
            this.logger.error(`Safe embedding generation failed for post ${postId}: ${error.message}`);
            this.logger.error(`Error details:`, error.stack);
            // Never rethrow - this must not affect the post
        }
    }

    async getAll(limit: number, skip: number): Promise<{ posts: Post[]; hasMore: boolean; total: number }> {
        try {
            const total = await this.postModel.countDocuments({
                $or: [{ isHidden: false }, { isHidden: { $exists: false } }],
            });

            const posts = await this.postModel
                .find({ $or: [{ isHidden: false }, { isHidden: { $exists: false } }] })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'user',
                    select: 'name imageUrl avatarURL',
                })
                .lean() // Use lean for better performance
                .exec();

            const hasMore = skip + posts.length < total;

            return { posts, hasMore, total };
        } catch (error) {
            this.logger.error('Error getting paginated posts:', error);
            throw new InternalServerErrorException('Lỗi khi lấy danh sách bài viết');
        }
    }

    async getOne(id: string): Promise<Post> {
        try {
            const post = await this.postModel
                .findById(id)
                .populate({
                    path: 'user',
                    select: 'name avatarURL',
                })
                .exec();

            if (!post) {
                throw new NotFoundException(`Không tìm thấy bài viết với id ${id}`);
            }
            return post;
        } catch (error) {
            this.logger.error('Error getting post:', error);
            throw new InternalServerErrorException('Lỗi khi lấy bài viết');
        }
    }

    async deleteCache(ownerId: string) {
        try {
            const cacheKey = `posts_by_owner_${ownerId}`;
            await this.cacheService.deleteCache(cacheKey);
        } catch (error) {
            this.logger.error('Error deleting cache:', error);
        }
    }

    async getByUserId(ownerId: string): Promise<Post[]> {
        try {
            await this.findOwnerById(ownerId);
            const posts = await this.postModel
                .find({
                    user: ownerId,
                    $or: [
                        { isHidden: false },
                        { isHidden: { $exists: false } }
                    ]
                })
                .sort({ createdAt: -1 })
                .populate({
                    path: 'user',
                    select: 'name imageUrl avatarURL',
                })
                .exec();

            return posts;
        } catch (error) {
            this.logger.error('Error getting posts by owner:', error);
            throw new InternalServerErrorException('Lỗi khi lấy bài viết của người dùng');
        }
    }

    async update(id: string, updatePostDto: UpdatePostDto) {
        try {
            this.logger.log(`Updating post ${id}`);

            const existingPost = await this.postModel.findById(id);
            if (!existingPost) {
                throw new NotFoundException('Post not found');
            }

            const mediaUrls = updatePostDto.media ?? existingPost.media ?? [];
            const images = (updatePostDto.images ?? []) as Express.Multer.File[];

            // Handle new image uploads
            if (images.length > 0) {
                const newMediaUrls: string[] = [];
                for (const file of images) {
                    const uploadResult = await this.cloudinaryService.uploadFile(
                        file,
                        `Posts/${existingPost.user}`
                    );
                    newMediaUrls.push(uploadResult.secure_url);
                }
                existingPost.media = [...mediaUrls, ...newMediaUrls];
            } else if (updatePostDto.media) {
                existingPost.media = updatePostDto.media;
            }

            // Update content if provided
            if (updatePostDto.content !== undefined) {
                existingPost.content = updatePostDto.content;
            }

            // Update keywords if provided
            if (updatePostDto.keywords !== undefined) {
                existingPost.keywords = updatePostDto.keywords;
            }

            //existingPost.updatedAt = new Date();
            const updatedPost = await existingPost.save();

            this.logger.log(`Post updated successfully: ${id}`);

            // Schedule embedding update if content changed (but don't wait for it)
            if (updatePostDto.content !== undefined || updatePostDto.keywords !== undefined) {
                this.scheduleEmbeddingGeneration(id, updatedPost.content, updatedPost.keywords);
            }

            return updatedPost;

        } catch (error) {
            this.logger.error(`Error updating post ${id}:`, error);
            throw new InternalServerErrorException('Lỗi khi cập nhật bài viết');
        }
    }

    async delete(id: string): Promise<{ message: string }> {
        try {
            const updated = await this.postModel.findByIdAndUpdate(
                id,
                { isHidden: true, updatedAt: new Date() },
                { new: true }
            );
            if (!updated) {
                throw new NotFoundException(`Post with id ${id} not found`);
            }

            return { message: `Post with id ${id} deleted successfully` };
        } catch (error) {
            this.logger.error('Error deleting post:', error);
            throw new InternalServerErrorException('Lỗi khi xóa bài viết');
        }
    }

    async search(query: string) {
        return this.postModel.find({
            $and: [
                {
                    $or: [
                        { content: { $regex: query, $options: 'i' } },
                        { keywords: { $regex: query, $options: 'i' } }
                    ]
                },
                {
                    $or: [
                        { isHidden: false },
                        { isHidden: { $exists: false } }
                    ]
                }
            ]
        })
            .limit(5)
            .populate('user', '_id name avatarURL')
            .lean();
    }

    async semanticSearch(
        query: string,
        limit: number = 10,
        minSimilarity: number = 0.5
    ): Promise<Array<{ post: Post; similarity: number }>> {
        try {
            return await this.vectorSearchService.semanticSearch(query, limit, minSimilarity);
        } catch (error) {
            this.logger.error('Error in semantic search:', error);
            throw new InternalServerErrorException('Lỗi khi tìm kiếm ngữ nghĩa');
        }
    }

    async findSimilarPosts(
        postId: string,
        limit: number = 5,
        minSimilarity: number = 0.6
    ): Promise<Array<{ post: Post; similarity: number }>> {
        try {
            const post = await this.postModel.findById(postId).lean();
            if (!post) {
                throw new NotFoundException('Post not found');
            }

            if (!post.embedding || !Array.isArray(post.embedding) || post.embedding.length === 0) {
                // Schedule embedding generation but return empty for now
                this.scheduleEmbeddingGeneration(postId, post.content, post.keywords);
                return [];
            }

            const similarPosts = await this.vectorSearchService.findSimilarPosts(
                post.embedding,
                limit,
                minSimilarity,
                postId
            );

            return similarPosts;
        } catch (error) {
            this.logger.error('Error finding similar posts:', error);
            throw new InternalServerErrorException('Lỗi khi tìm bài viết tương tự');
        }
    }

    async ensureAllPostsHaveEmbeddings(): Promise<void> {
        try {
            await this.vectorSearchService.ensureEmbeddingsExist();
        } catch (error) {
            this.logger.error('Error ensuring embeddings exist:', error);
            // Don't throw - this is a background task
        }
    }

    // Debug method to check post existence
    async checkPostExists(postId: string): Promise<boolean> {
        try {
            const post = await this.postModel.findById(postId).select('_id').lean();
            return !!post;
        } catch (error) {
            this.logger.error(`Error checking post existence: ${error.message}`);
            return false;
        }
    }
}