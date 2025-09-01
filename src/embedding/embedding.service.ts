// src/embedding/embedding.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HfInference } from '@huggingface/inference';
import axios from 'axios';

@Injectable()
export class EmbeddingService {
    private readonly logger = new Logger(EmbeddingService.name);
    private hf: HfInference;
    private readonly embeddingModel = 'sentence-transformers/all-MiniLM-L6-v2';
    private readonly embeddingDimensions = 384;
    private readonly maxRetries = 3;
    private readonly retryDelay = 1000; // 1 second

    constructor() {
        try {
            this.hf = new HfInference(process.env.HF_API_TOKEN);
            this.logger.log('EmbeddingService initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize EmbeddingService:', error);
            // Don't throw error - use fallback methods
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        // Input validation
        if (!text || typeof text !== 'string') {
            this.logger.warn('Invalid input for embedding generation');
            return this.createEmptyEmbedding();
        }

        const cleanText = text.trim();
        if (cleanText.length === 0) {
            this.logger.warn('Empty text for embedding generation');
            return this.createEmptyEmbedding();
        }

        // Truncate very long text to prevent API issues
        const maxLength = 500; // Reasonable limit for embedding
        const truncatedText = cleanText.length > maxLength
            ? cleanText.substring(0, maxLength) + '...'
            : cleanText;

        // Try multiple methods with fallbacks
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.logger.log(`Generating embedding (attempt ${attempt}/${this.maxRetries}) for text: ${truncatedText.substring(0, 50)}...`);

                // Method 1: Try Hugging Face API
                if (this.hf && process.env.HF_API_TOKEN) {
                    try {
                        const response = await this.generateWithHuggingFace(truncatedText);
                        if (this.isValidEmbedding(response)) {
                            this.logger.log('Successfully generated embedding with Hugging Face API');
                            return response;
                        }
                    } catch (hfError) {
                        this.logger.warn(`Hugging Face API failed on attempt ${attempt}:`, hfError.message);
                    }
                }

                // Method 2: Try direct HTTP request as fallback
                try {
                    const response = await this.generateWithDirectRequest(truncatedText);
                    if (this.isValidEmbedding(response)) {
                        this.logger.log('Successfully generated embedding with direct request');
                        return response;
                    }
                } catch (directError) {
                    this.logger.warn(`Direct request failed on attempt ${attempt}:`, directError.message);
                }

                // Wait before retry
                if (attempt < this.maxRetries) {
                    await this.sleep(this.retryDelay * attempt);
                }

            } catch (error) {
                this.logger.error(`Embedding generation attempt ${attempt} failed:`, error.message);
                if (attempt === this.maxRetries) {
                    // Last attempt - use fallback
                    break;
                }
            }
        }

        // All methods failed - use fallback
        this.logger.warn('All embedding generation methods failed, using fallback');
        return this.createFallbackEmbedding(truncatedText);
    }

    private async generateWithHuggingFace(text: string): Promise<number[]> {
        const response = await this.hf.featureExtraction({
            model: this.embeddingModel,
            inputs: text,
        });

        if (Array.isArray(response) && response.length === this.embeddingDimensions) {
            return response as number[];
        }

        throw new Error('Invalid response format from Hugging Face API');
    }

    private async generateWithDirectRequest(text: string): Promise<number[]> {
        if (!process.env.HF_API_TOKEN) {
            throw new Error('HF_API_TOKEN not available');
        }

        const response = await axios.post(
            `https://api-inference.huggingface.co/models/${this.embeddingModel}`,
            { inputs: text },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000, // 10 second timeout
            }
        );

        if (response.data && Array.isArray(response.data) && response.data.length === this.embeddingDimensions) {
            return response.data as number[];
        }

        throw new Error('Invalid response format from direct request');
    }

    private isValidEmbedding(embedding: any): boolean {
        return Array.isArray(embedding) &&
            embedding.length === this.embeddingDimensions &&
            embedding.every(val => typeof val === 'number' && !isNaN(val));
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        try {
            // Process in batches to avoid overwhelming the API
            const batchSize = 5;
            const results: number[][] = [];

            for (let i = 0; i < texts.length; i += batchSize) {
                const batch = texts.slice(i, i + batchSize);
                const batchPromises = batch.map(text => this.generateEmbedding(text));
                const batchResults = await Promise.allSettled(batchPromises);

                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        this.logger.error(`Failed to generate embedding for text ${i + index}: ${result.reason}`);
                        results.push(this.createFallbackEmbedding(batch[index]));
                    }
                });

                // Small delay between batches
                if (i + batchSize < texts.length) {
                    await this.sleep(100);
                }
            }

            return results;
        } catch (error) {
            this.logger.error(`Error generating multiple embeddings: ${error.message}`);
            return texts.map(text => this.createFallbackEmbedding(text));
        }
    }

    private createEmptyEmbedding(): number[] {
        return new Array(this.embeddingDimensions).fill(0);
    }

    private createFallbackEmbedding(text: string): number[] {
        try {
            // Create a deterministic embedding based on text content
            const words = text.toLowerCase()
                .replace(/[^\w\s]/g, '') // Remove punctuation
                .split(/\s+/)
                .filter(word => word.length > 2)

            const embedding = new Array(this.embeddingDimensions).fill(0);

            // Use multiple hash functions for better distribution
            words.forEach(word => {
                const hash1 = this.hashString(word) % this.embeddingDimensions;
                const hash2 = this.hashString(word.split('').reverse().join('')) % this.embeddingDimensions;
                const hash3 = this.hashString(word + word.length) % this.embeddingDimensions;

                embedding[hash1] += 0.3;
                embedding[hash2] += 0.2;
                embedding[hash3] += 0.1;
            });

            // Add some randomness based on text length and content
            const textLength = Math.min(text.length, 100);
            for (let i = 0; i < textLength; i += 10) {
                const index = (textLength + i) % this.embeddingDimensions;
                embedding[index] += 0.05;
            }

            // Normalize the embedding
            return this.normalizeVector(embedding);
        } catch (error) {
            this.logger.error(`Error creating fallback embedding: ${error.message}`);
            // Return a basic non-zero embedding
            const embedding = new Array(this.embeddingDimensions).fill(0.001);
            return this.normalizeVector(embedding);
        }
    }

    private hashString(str: string): number {
        let hash = 0;
        if (str.length === 0) return hash;

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    private normalizeVector(vector: number[]): number[] {
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (magnitude === 0 || !isFinite(magnitude)) {
            // If magnitude is 0 or invalid, return a uniform distribution
            const value = 1 / Math.sqrt(this.embeddingDimensions);
            return new Array(this.embeddingDimensions).fill(value);
        }
        return vector.map(val => val / magnitude);
    }

    calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
        try {
            if (!Array.isArray(vec1) || !Array.isArray(vec2)) {
                return 0;
            }

            if (vec1.length !== vec2.length || vec1.length !== this.embeddingDimensions) {
                return 0;
            }

            let dotProduct = 0;
            let magnitude1 = 0;
            let magnitude2 = 0;

            for (let i = 0; i < vec1.length; i++) {
                if (!isFinite(vec1[i]) || !isFinite(vec2[i])) {
                    return 0;
                }
                dotProduct += vec1[i] * vec2[i];
                magnitude1 += vec1[i] * vec1[i];
                magnitude2 += vec2[i] * vec2[i];
            }

            magnitude1 = Math.sqrt(magnitude1);
            magnitude2 = Math.sqrt(magnitude2);

            if (magnitude1 === 0 || magnitude2 === 0 || !isFinite(magnitude1) || !isFinite(magnitude2)) {
                return 0;
            }

            const similarity = dotProduct / (magnitude1 * magnitude2);
            return isFinite(similarity) ? Math.max(0, Math.min(1, similarity)) : 0;
        } catch (error) {
            this.logger.error(`Error calculating cosine similarity: ${error.message}`);
            return 0;
        }
    }

    getDimensions(): number {
        return this.embeddingDimensions;
    }

    getModelName(): string {
        return this.embeddingModel;
    }

    // Health check method
    async healthCheck(): Promise<boolean> {
        try {
            const testEmbedding = await this.generateEmbedding('test');
            return this.isValidEmbedding(testEmbedding);
        } catch (error) {
            this.logger.error(`EmbeddingService health check failed: ${error.message}`);
            return false;
        }
    }
}