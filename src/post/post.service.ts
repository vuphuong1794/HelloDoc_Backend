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
import * as dayjs from 'dayjs';
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
        let savedPost: Post;
        try {
            const uploadedMediaUrls: string[] = [];

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

            const nowVN = dayjs().add(7, "hour").toDate();

            // Create post data object
            const postData = new this.postModel({
                user: createPostDto.userId,
                userModel: createPostDto.userModel,
                content: createPostDto.content,
                media: uploadedMediaUrls,
                keywords: createPostDto.keywords || '',
                isHidden: false,

                embedding: [],
                embeddingModel: '',
                embeddingUpdatedAt: null,

                createdAt: nowVN,
                updatedAt: nowVN
            });




            savedPost = await postData.save();

            this.logger.log(`Post created successfully with ID: ${savedPost._id}`);

            this.generateEmbeddingAsync(savedPost._id.toString(), savedPost.content, savedPost.keywords);

            return savedPost;
        } catch (error) {
            this.logger.error('Error creating post:', error);
            throw new InternalServerErrorException('Lỗi khi tạo bài viết');
        }
    }


    // Separate async method for embedding generation that won't affect the main post
    private async generateEmbeddingAsync(postId: string, content: string, keywords?: string): Promise<void> {
        // Use setTimeout instead of setImmediate for better error isolation

        try {
            await this.generateAndStoreEmbedding(postId, content, keywords);
        } catch (error) {
            this.logger.error(`Failed to generate embedding for post ${postId}: ${error.message}`);
            // Don't let embedding errors affect the post itself
        }
    }

    private async generateAndStoreEmbedding(postId: string, content: string, keywords?: string): Promise<void> {
        try {
            // Check if post exists
            const existingPost = await this.postModel.findById(postId).select('_id content keywords embedding');
            if (!existingPost) {
                this.logger.warn(`Post ${postId} not found when generating embedding`);
                return;
            }

            // Check if embedding already exists
            if (existingPost.embedding && Array.isArray(existingPost.embedding) && existingPost.embedding.length > 0) {
                this.logger.log(`Post ${postId} already has embedding, skipping`);
                return;
            }

            const textForEmbedding = `${content} ${keywords || ''}`.trim();

            if (textForEmbedding && textForEmbedding.length > 0) {
                this.logger.log(`Generating embedding for post ${postId}`);

                const embedding = await this.embeddingService.generateEmbedding(textForEmbedding);

                const updateResult = await this.postModel.findByIdAndUpdate(
                    postId,
                    {
                        $set: {
                            embedding,
                            embeddingModel: this.embeddingService.getModelName(),
                            embeddingUpdatedAt: new Date(),
                        }
                    },
                    { new: true }
                );


                if (updateResult) {
                    this.logger.log(`Embedding generated and stored for post ${postId}`);
                } else {
                    this.logger.log(`Embedding already exists for post ${postId}, skipping`);
                }
            }
        } catch (error) {
            this.logger.error(`Error generating embedding for post ${postId}: ${error.message}`, error.stack);
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
        let updatedPost: Post;

        try {
            this.logger.log(`Updating post ${id} with data:`, JSON.stringify(updatePostDto, null, 2));

            const existingPost = await this.postModel.findById(id);
            if (!existingPost) {
                throw new NotFoundException('Post not found');
            }

            this.logger.log(`Found existing post:`, JSON.stringify(existingPost.toObject(), null, 2));

            const mediaUrls = updatePostDto.media ?? existingPost.media ?? [];
            const images = (updatePostDto.images ?? []) as Express.Multer.File[];

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

            if (updatePostDto.content !== undefined) {
                existingPost.content = updatePostDto.content;
            }

            if (updatePostDto.keywords !== undefined) {
                existingPost.keywords = updatePostDto.keywords;
            }

            updatedPost = await existingPost.save();

            this.logger.log(`Post updated successfully:`, JSON.stringify((updatedPost as any).toObject(), null, 2));

            // Update embedding if content or keywords changed
            if (updatePostDto.content !== undefined || updatePostDto.keywords !== undefined) {
                this.updateEmbeddingAsync(updatedPost._id.toString(), updatedPost.content, updatedPost.keywords);
            }

            return updatedPost;

        } catch (error) {
            this.logger.error(`Error updating post ${id}:`, error);
            throw new InternalServerErrorException('Lỗi khi cập nhật bài viết');
        }
    }

    private updateEmbeddingAsync(postId: string, content: string, keywords?: string): void {
        setTimeout(async () => {
            try {
                await this.updateEmbedding(postId, content, keywords);
            } catch (error) {
                this.logger.error(`Failed to update embedding for post ${postId}: ${error.message}`);
            }
        }, 1000);
    }

    private async updateEmbedding(postId: string, content: string, keywords?: string): Promise<void> {
        try {
            const textForEmbedding = `${content} ${keywords || ''}`.trim();

            if (textForEmbedding && textForEmbedding.length > 0) {
                const embedding = await this.embeddingService.generateEmbedding(textForEmbedding);

                await this.postModel.updateOne(
                    { _id: postId },
                    {
                        $set: {
                            embedding,
                            embeddingModel: this.embeddingService.getModelName(),
                            embeddingUpdatedAt: new Date(),
                        }
                    }
                );

                this.logger.log(`Updated embedding for post ${postId}`);
            }
        } catch (error) {
            this.logger.error(`Error updating embedding for post ${postId}: ${error.message}`);
        }
    }

    async delete(id: string): Promise<{ message: string }> {
        try {
            const updated = await this.postModel.findByIdAndUpdate(
                id,
                { isHidden: true },
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
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } },
                { keywords: { $regex: query, $options: 'i' } }
            ]
        })
            .limit(5)
            .populate('user', '_id name avatarURL');
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
            const post = await this.postModel.findById(postId);
            if (!post) {
                throw new NotFoundException('Post not found');
            }

            if (!post.embedding || !Array.isArray(post.embedding) || post.embedding.length === 0) {
                // Generate embedding if missing, but don't wait for it
                this.generateEmbeddingAsync(postId, post.content, post.keywords);
                return []; // Return empty array for now
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
        await this.vectorSearchService.ensureEmbeddingsExist();
    }

    // ================ Hybrid Search ================

    async hybridSearch(q: string, limit = 5, minSimilarity = 0.75) {
        // 1. Tạo embedding cho query
        const queryEmbedding = await this.embeddingService.generateEmbedding(q);

        // 2. Lấy toàn bộ post (có thể thay bằng ANN index để tối ưu sau)
        const posts = await this.postModel.find({ isHidden: false });

        // 3. Tính cosine similarity
        const withSimilarity = posts.map((post: any) => {
            const similarity = this.cosineSimilarity(queryEmbedding, post.embedding);
            return { post, similarity };
        });

        // 4. Semantic filter
        const semanticResults = withSimilarity
            .filter((item) => item.similarity >= minSimilarity)
            .map((item) => ({
                ...item,
                keywordScore: 0,
            }));

        // 5. Full-text search (chỉ lấy content, title, keywords)
        const regex = new RegExp(q, 'i');
        const keywordResults = await this.postModel.find({
            $or: [{ content: regex }, { keywords: regex }],
            isHidden: false,
        });

        const keywordWithScore = keywordResults.map((post: any) => ({
            post,
            similarity: 0,
            keywordScore: 1, // cho điểm 1 nếu match exact keyword
        }));

        // 6. Gộp 2 danh sách
        const combined = [...semanticResults, ...keywordWithScore];

        // 7. Tính finalScore
        const results = combined.map((item) => ({
            post: item.post,
            similarity: item.similarity,
            keywordScore: item.keywordScore,
            finalScore: item.similarity * 0.7 + item.keywordScore * 0.3, // α=0.7, β=0.3
        }));

        // 8. Sort theo finalScore
        return results
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, limit);
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dot / (normA * normB);
    }
}