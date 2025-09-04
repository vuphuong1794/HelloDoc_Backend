import { Injectable } from '@nestjs/common';

export interface ArticleRelevanceResult {
    content: string;
    relevanceScore: number;
    isRelevant: boolean;
    topics?: string[];
    summary?: string;
}

@Injectable()
export class HuggingFaceService {
    private readonly HF_API_TOKEN = process.env.HF_API_TOKEN;
    private readonly RELEVANCE_THRESHOLD = 0.6; // Ngưỡng để xác định bài viết có liên quan

    /**
     * Kiểm tra và lọc các bài viết liên quan đến query
     */
    async filterRelevantArticles(
        articles: string[],
        query: string,
        options?: {
            threshold?: number;
            includeTopics?: boolean;
            includeSummary?: boolean;
            maxArticles?: number;
        }
    ): Promise<ArticleRelevanceResult[]> {
        const threshold = options?.threshold ?? this.RELEVANCE_THRESHOLD;
        const relevantArticles: ArticleRelevanceResult[] = [];

        for (const content of articles) {
            try {
                // Sử dụng zero-shot classification để đánh giá độ liên quan
                const relevanceScore = await this.zeroShotClassification(query, content);

                if (relevanceScore >= threshold) {
                    const result: ArticleRelevanceResult = {
                        content,
                        relevanceScore,
                        isRelevant: true
                    };

                    // Thêm thông tin chủ đề nếu được yêu cầu
                    if (options?.includeTopics) {
                        result.topics = await this.classifyTopic(content);
                    }

                    // Thêm tóm tắt nếu được yêu cầu
                    if (options?.includeSummary) {
                        result.summary = await this.summarizeContent(content);
                    }

                    relevantArticles.push(result);
                }

                // Giới hạn số lượng bài viết trả về
                if (options?.maxArticles && relevantArticles.length >= options.maxArticles) {
                    break;
                }
            } catch (error) {
                console.error('Error processing article:', error);
                continue;
            }
        }

        // Sắp xếp theo độ liên quan giảm dần
        return relevantArticles.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * Phân loại bài viết có liên quan đến từ khóa tìm kiếm hay không (cải thiện)
     */
    async isRelevant(content: string, query: string): Promise<boolean> {
        const score = await this.zeroShotClassification(query, content);
        return score >= this.RELEVANCE_THRESHOLD;
    }

    /**
  * Tính điểm độ liên quan giữa query và content using sentence similarity
  */
    async calculateRelevanceScore(content: string, query: string): Promise<number> {
        try {
            // Giới hạn độ dài content để tránh vượt quá token limit
            const truncatedContent = content.substring(0, 500);

            const response = await fetch(
                'https://api-inference.huggingface.co/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.HF_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inputs: {
                            source_sentence: query,
                            sentences: [truncatedContent],
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HF API error: ${response.status} - ${errorText}`);
                return 0.5; // Return default score on error
            }

            const scores = await response.json();

            if (Array.isArray(scores) && scores.length > 0) {
                return Math.max(0, Math.min(1, scores[0])); // Ensure score between 0-1
            }

            return 0.5;

        } catch (error) {
            console.error('Error calculating relevance score:', error);
            return 0.5; // Return default score on error
        }
    }

    /**
     * Phân loại chủ đề bài viết sử dụng zero-shot classification
     */
    async classifyTopic(content: string): Promise<string[]> {
        try {
            const topicLabels = [
                'technology', 'business', 'health', 'education', 'entertainment',
                'sports', 'politics', 'science', 'travel', 'food', 'fashion', 'lifestyle'
            ];

            const response = await fetch(
                'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.HF_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inputs: content.substring(0, 512),
                        parameters: {
                            candidate_labels: topicLabels,
                        },
                    }),
                }
            );

            if (!response.ok) {
                console.error(`HF API error: ${response.status}`);
                return [];
            }

            const data = await response.json();
            const labels: string[] = data.labels || [];
            const scores: number[] = data.scores || [];

            // Lấy các topic có score > 0.3
            return labels.filter((_, index) => scores[index] > 0.3);
        } catch (error) {
            console.error('Error classifying topics:', error);
            return [];
        }
    }

    /**
     * Tóm tắt bài viết sử dụng summarization model
     */
    async summarizeContent(content: string): Promise<string> {
        try {
            const response = await fetch(
                'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.HF_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inputs: content.substring(0, 1024),
                        parameters: {
                            max_length: 150,
                            min_length: 30,
                            do_sample: false
                        }
                    }),
                }
            );

            if (!response.ok) {
                console.error(`HF API error: ${response.status}`);
                return '';
            }

            const data = await response.json();
            return data[0]?.summary_text || '';
        } catch (error) {
            console.error('Error summarizing content:', error);
            return '';
        }
    }

    /**
     * Zero-shot classification cải thiện để kiểm tra relevance
     */
    async zeroShotClassification(query: string, content: string): Promise<number> {
        try {
            // Cắt ngắn content để tránh vượt quá giới hạn token
            const truncatedContent = content.substring(0, 512);

            const response = await fetch(
                'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.HF_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inputs: truncatedContent,
                        parameters: {
                            candidate_labels: [query, 'không liên quan'],
                        }

                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HF API error: ${response.status} - ${errorText}`);
                return 0;
            }

            const data = await response.json();
            const labels: string[] = data.labels || [];
            const scores: number[] = data.scores || [];

            // Tìm index của label "related to {query}"
            const relevantIndex = labels.findIndex(label =>
                label.includes('related to')
            );

            return relevantIndex !== -1 ? scores[relevantIndex] : 0;
        } catch (error) {
            console.error('Error in zero-shot classification:', error);
            return 0;
        }
    }

    /**
     * Batch processing để xử lý nhiều bài viết cùng lúc (tối ưu hiệu suất)
     */
    async batchProcessArticles(
        articles: string[],
        query: string,
        batchSize: number = 5
    ): Promise<ArticleRelevanceResult[]> {
        const results: ArticleRelevanceResult[] = [];

        for (let i = 0; i < articles.length; i += batchSize) {
            const batch = articles.slice(i, i + batchSize);
            const batchPromises = batch.map(async (content) => {
                const relevanceScore = await this.zeroShotClassification(query, content);
                return {
                    content,
                    relevanceScore,
                    isRelevant: relevanceScore >= this.RELEVANCE_THRESHOLD
                };
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults.filter(result => result.isRelevant));
        }

        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
}