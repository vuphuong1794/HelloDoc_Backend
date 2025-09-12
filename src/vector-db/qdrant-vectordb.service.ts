import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantService {
    private readonly logger = new Logger(QdrantService.name);
    private client: QdrantClient;

    constructor() {
        this.client = new QdrantClient({
            url: process.env.QDRANT_URL,       // ví dụ: "https://xxx.cloud.qdrant.io"
            apiKey: process.env.QDRANT_API_KEY // lấy từ Qdrant Cloud
        });
    }

    async initCollection() {
        try {
            await this.client.createCollection('posts', {
                vectors: {
                    size: 384,         // phải khớp với dimension của model embedding bạn đang dùng
                    distance: 'Cosine' // Cosine phổ biến cho semantic search
                }
            });
            this.logger.log('Qdrant collection "posts" initialized');
        } catch (err: any) {
            if (err.status === 409) {
                this.logger.log('Collection "posts" đã tồn tại, skip.');
            } else {
                this.logger.error('Error creating collection', err);
            }
        }
    }

    async upsertPost(postId: string, vector: number[], payload: any) {
        this.logger.debug('Upserting post to Qdrant', {
            id: postId,
            vectorLength: vector?.length,
            payload,
        });

        return this.client.upsert('posts', {
            points: [
                {
                    id: postId.toString(), // đảm bảo là string
                    vector,
                    payload
                }
            ]
        });
    }


    async findSimilarPosts(
        queryVector: number[],
        limit = 5,
        minSimilarity = 0.5,
        excludeId?: string
    ) {
        const results = await this.client.search('posts', {
            vector: queryVector,
            limit,
            score_threshold: minSimilarity,
            filter: excludeId
                ? { must_not: [{ key: 'postId', match: { value: excludeId } }] }
                : undefined
        });

        return results.map((r) => ({
            postId: r.payload?.postId,
            similarity: r.score
        }));
    }
}
