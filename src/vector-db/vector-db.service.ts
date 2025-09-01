// src/vector-search/vector-search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from 'src/schemas/Post.schema';
import { EmbeddingService } from 'src/embedding/embedding.service';

@Injectable()
export class VectorSearchService {
    private readonly logger = new Logger(VectorSearchService.name);

    constructor(
        @InjectModel(Post.name) private postModel: Model<Post>,
        private embeddingService: EmbeddingService,
    ) { }

    async findSimilarPosts(
        queryEmbedding: number[],
        limit: number = 5,
        minSimilarity: number = 0.6,
        excludePostId?: string
    ): Promise<Array<{ post: Post; similarity: number }>> {
        try {
            // Sử dụng MongoDB Atlas Vector Search
            const aggregationPipeline: any[] = [
                {
                    $vectorSearch: {
                        index: 'default',
                        path: 'embedding',
                        queryVector: queryEmbedding,
                        numCandidates: Math.max(100, limit * 10),
                        limit: limit * 3,
                    },
                },
                {
                    $match: {
                        isHidden: { $ne: true },
                        ...(excludePostId && { _id: { $ne: excludePostId } }),
                    },
                },
                {
                    $project: {
                        _id: 1,
                        content: 1,
                        keywords: 1,
                        media: 1,
                        user: 1,
                        userModel: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        similarity: { $meta: 'vectorSearchScore' },
                    },
                },
                {
                    $match: {
                        similarity: { $gte: minSimilarity },
                    },
                },
                {
                    $sort: { similarity: -1 },
                },
                {
                    $limit: limit,
                },
            ];

            const results = await this.postModel.aggregate(aggregationPipeline);

            // Populate user information
            const populatedResults = await Promise.all(
                results.map(async (item) => {
                    const post = await this.postModel.findById(item._id)
                        .select('-embedding') //không trả về embedding
                        .populate({
                            path: 'user',
                            select: 'name avatarURL imageUrl',


                        });
                    return {
                        post: post ? post.toObject() : null,
                        similarity: item.similarity,
                    };
                })
            );

            return populatedResults.filter(item => item.post !== null) as Array<{ post: Post; similarity: number }>;

        } catch (error) {
            this.logger.error(`Vector search failed: ${error.message}`);

            // Fallback to manual similarity calculation
            return this.manualSimilaritySearch(queryEmbedding, limit, minSimilarity, excludePostId);
        }
    }

    private async manualSimilaritySearch(
        queryEmbedding: number[],
        limit: number,
        minSimilarity: number,
        excludePostId?: string
    ): Promise<Array<{ post: Post; similarity: number }>> {
        try {
            const posts = await this.postModel
                .find({
                    isHidden: { $ne: true },
                    embedding: { $exists: true, $ne: null },
                    ...(excludePostId && { _id: { $ne: excludePostId } }),
                })
                .populate({
                    path: 'user',
                    select: 'name avatarURL imageUrl',
                })
                .limit(100) // Giới hạn số lượng bài viết để tính toán
                .exec();

            const postsWithSimilarity = await Promise.all(
                posts.map(async (post) => {
                    const similarity = this.embeddingService.calculateCosineSimilarity(
                        queryEmbedding,
                        post.embedding
                    );
                    return { post, similarity };
                })
            );

            return postsWithSimilarity
                .filter(item => item.similarity >= minSimilarity)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);
        } catch (error) {
            this.logger.error(`Manual similarity search failed: ${error.message}`);
            return [];
        }
    }


    async semanticSearch(
        query: string,
        limit: number = 10,
        minSimilarity: number = 0.5
    ): Promise<Array<{ post: Post; similarity: number }>> {
        try {
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);

            // Nếu query ngắn thì nâng threshold, nhưng không quá gắt
            const queryWordCount = query.trim().split(/\s+/).length;
            const effectiveMinSim = queryWordCount <= 2 ? Math.max(0.7, minSimilarity) : minSimilarity;

            const results = await this.findSimilarPosts(queryEmbedding, limit * 2, 0.3);
            // cho threshold thấp (0.3) để lấy nhiều ứng viên, lọc sau

            const q = query.toLowerCase();

            let filteredResults = results.filter(item => {
                const content = item.post.content?.toLowerCase() || '';
                const keywords = item.post.keywords?.toLowerCase() || '';
                const q = query.toLowerCase();

                // Chỉ giữ lại khi similarity >= ngưỡng
                // Nhưng nếu có từ khóa trùng thì cộng thêm 0.1 vào similarity để đẩy lên
                let sim = item.similarity;
                if (content.includes(q) || keywords.includes(q)) {
                    sim += 0.1;
                }

                return sim >= effectiveMinSim;
            });


            // Nếu lọc xong rỗng → fallback giữ top N similarity cao nhất
            if (filteredResults.length === 0) {
                this.logger.warn(`No results above threshold, returning top similarity results instead`);
                filteredResults = results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
            }

            return filteredResults.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
        } catch (error) {
            this.logger.error(`Semantic search failed: ${error.message}`);
            return [];
        }
    }



    async ensureEmbeddingsExist(): Promise<void> {
        try {
            const postsWithoutEmbeddings = await this.postModel
                .find({
                    embedding: { $exists: false },
                    isHidden: { $ne: true },
                    content: { $exists: true, $ne: '' },
                })
                .limit(50)
                .exec();

            if (postsWithoutEmbeddings.length > 0) {
                this.logger.log(`Generating embeddings for ${postsWithoutEmbeddings.length} posts`);

                for (const post of postsWithoutEmbeddings) {
                    try {
                        const textForEmbedding = `${post.content} ${post.keywords || ''}`.trim();
                        if (textForEmbedding) {
                            const embedding = await this.embeddingService.generateEmbedding(textForEmbedding);
                            await this.postModel.findByIdAndUpdate(post._id, {
                                embedding,
                                embeddingModel: this.embeddingService.getModelName(),
                                embeddingUpdatedAt: new Date(),
                            });
                        }
                    } catch (error) {
                        this.logger.error(`Failed to generate embedding for post ${post._id}: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Error ensuring embeddings exist: ${error.message}`);
        }
    }
}