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

    //Tìm các bài viết tương tự dựa trên vector embedding
    async findSimilarPosts(
        queryEmbedding: number[], //Vector embedding của query (384 chiều)
        limit: number = 5, //Số lượng kết quả tối đa
        minSimilarity: number = 0.7, //Ngưỡng similarity tối thiểu
        excludePostId?: string //ID bài viết cần loại trừ
    ): Promise<Array<{ post: Post; similarity: number }>> {
        try {
            // Phương pháp 1: Sử dụng MongoDB Atlas Vector Search
            const aggregationPipeline: any[] = [
                {
                    $vectorSearch: {
                        index: 'vector_index',
                        path: 'embedding', // Field chứa vector trong document
                        queryVector: queryEmbedding, // Vector query để so sánh
                        numCandidates: Math.max(100, limit * 10), // Số ứng viên để xét 
                        limit: limit * 3, // Lấy nhiều hơn limit để sau đó filter
                    },
                },
                {
                    // Lọc các bài viết không bị ẩn và loại trừ bài viết cụ thể
                    $match: {
                        isHidden: { $ne: true },
                        ...(excludePostId && { _id: { $ne: excludePostId } }), // Loại trừ bài viết cụ thể
                    },
                },
                {
                    // Chọn các field cần thiết + điểm similarity
                    $project: {
                        _id: 1,
                        content: 1,
                        keywords: 1,
                        media: 1,
                        user: 1,
                        userModel: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        similarity: { $meta: 'vectorSearchScore' }, // Điểm similarity từ vector search
                    },
                },
                {
                    // Lọc theo ngưỡng similarity tối thiểu
                    $match: {
                        similarity: { $gte: minSimilarity },
                    },
                },
                {
                    // Sắp xếp theo similarity giảm dần (cao nhất trước)
                    $sort: { similarity: -1 },
                },
                {
                    // Giới hạn số lượng kết quả cuối cùng
                    $limit: limit,
                },
            ];

            // Thực hiện aggregation pipeline
            const results = await this.postModel.aggregate(aggregationPipeline);

            // Populate thông tin user cho mỗi bài viết
            const populatedResults = await Promise.all(
                results.map(async (item) => {
                    const post = await this.postModel.findById(item._id)
                        .select('-embedding')
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

            // Lọc bỏ các kết quả null và trả về
            return populatedResults.filter(item => item.post !== null) as Array<{ post: Post; similarity: number }>;

        } catch (error) {
            this.logger.error(`Vector search failed: ${error.message}`);

            // Phương pháp 2: Fallback - Tính similarity thủ công nếu Atlas Vector Search lỗi
            return this.manualSimilaritySearch(queryEmbedding, limit, minSimilarity, excludePostId);
        }
    }

    //Tính similarity thủ công khi MongoDB Atlas Vector Search không khả dụng
    private async manualSimilaritySearch(
        queryEmbedding: number[],
        limit: number,
        minSimilarity: number,
        excludePostId?: string
    ): Promise<Array<{ post: Post; similarity: number }>> {
        try {
            // Bước 1: Lấy tất cả bài viết có embedding (giới hạn 100 để tránh quá tải)
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
                .limit(100)
                .exec();

            // Bước 2: Tính cosine similarity cho từng bài viết
            const postsWithSimilarity = await Promise.all(
                posts.map(async (post) => {
                    // Sử dụng EmbeddingService để tính cosine similarity
                    const similarity = this.embeddingService.calculateCosineSimilarity(
                        queryEmbedding,
                        post.embedding
                    );
                    return { post, similarity };
                })
            );

            // Bước 3: Lọc, sắp xếp và giới hạn kết quả
            return postsWithSimilarity
                .filter(item => item.similarity >= minSimilarity) // Lọc theo ngưỡng
                .sort((a, b) => b.similarity - a.similarity) // Sắp xếp giảm dần
                .slice(0, limit); // Lấy top N kết quả

        } catch (error) {
            this.logger.error(`Manual similarity search failed: ${error.message}`);
            return []; // Trả về mảng rỗng nếu lỗi
        }
    }

    // tìm kiếm ngữ nghĩa (semantic search) 
    async semanticSearch(
        query: string,
        limit: number = 10,
        minSimilarity: number = 0.7
    ): Promise<Array<{ post: Post; similarity: number }>> {
        try {
            // Bước 1: Tạo embedding từ text query
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);

            // Bước 2: Điều chỉnh ngưỡng similarity dựa trên độ dài query
            // Query ngắn (≤2 từ) thường ít chính xác → tăng ngưỡng để lọc kỹ hơn
            const queryWordCount = query.trim().split(/\s+/).length;
            const effectiveMinSim = queryWordCount <= 2 ? Math.max(0.7, minSimilarity) : minSimilarity;

            // Bước 3: Tìm kiếm với ngưỡng thấp để lấy nhiều ứng viên
            const results = await this.findSimilarPosts(queryEmbedding, limit * 2, 0.3);

            // Bước 4: Lọc kết quả với logic nâng cao
            let filteredResults = results.filter(item => {
                const content = item.post.content?.toLowerCase() || '';
                const keywords = item.post.keywords?.toLowerCase() || '';
                const q = query.toLowerCase();

                // Tính similarity có điều chỉnh:
                // Nếu content hoặc keywords chứa exact query → bonus +0.1 similarity
                let adjustedSim = item.similarity;
                if (content.includes(q) || keywords.includes(q)) {
                    adjustedSim += 0.1; // Bonus cho exact match
                }

                // Chỉ giữ lại khi similarity (đã điều chỉnh) >= ngưỡng
                return adjustedSim >= effectiveMinSim;
            });

            // Bước 5: Fallback nếu không có kết quả thỏa mãn
            if (filteredResults.length === 0) {
                this.logger.warn(`No results above threshold, returning top similarity results instead`);
                // Nếu lọc quá gắt không còn kết quả → lấy top similarity cao nhất
                filteredResults = results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
            }

            // Bước 6: Sắp xếp và giới hạn kết quả cuối cùng
            return filteredResults.sort((a, b) => b.similarity - a.similarity).slice(0, limit);

        } catch (error) {
            this.logger.error(`Semantic search failed: ${error.message}`);
            return [];
        }
    }
}