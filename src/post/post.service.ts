// src/post/post.service.ts - VERSION ĐỂ DEBUG
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

@Injectable()
export class PostService {
    private readonly logger = new Logger(PostService.name);
    private postTracker = new Map<string, { createdAt: Date, lastSeen: Date, content: string }>();

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
        @InjectModel(Post.name) private postModel: Model<Post>,
        private cloudinaryService: CloudinaryService,
        private cacheService: CacheService,
        // KHÔNG inject EmbeddingService và VectorSearchService để loại trừ hoàn toàn
        // private embeddingService: EmbeddingService,
        // private vectorSearchService: VectorSearchService,
    ) {
        // Enable mongoose debug mode
        if (process.env.NODE_ENV !== 'production') {
            require('mongoose').set('debug', (collectionName, method, query, doc) => {
                this.logger.log(`MONGOOSE DEBUG: ${collectionName}.${method}`, {
                    query: JSON.stringify(query),
                    doc: doc ? JSON.stringify(doc).substring(0, 200) + '...' : 'none'
                });
            });
        }

        // Track all database operations
        this.setupDatabaseHooks();
    }

    private setupDatabaseHooks() {
        // Monitor all post operations
        this.postModel.schema.pre('save', function () {
            console.log(`PRE-SAVE: Post ${this._id} is being saved`);
            console.log(`Content: ${this.content?.substring(0, 50)}...`);
        });

        this.postModel.schema.post('save', function () {
            console.log(`POST-SAVE: Post ${this._id} has been saved successfully`);
        });

        // 'remove' middleware is not supported on models, use 'deleteOne' or 'findOneAndDelete' instead
        // this.postModel.schema.pre('remove', function () {
        //     console.log(`PRE-REMOVE: Post ${this._id} is being removed`);
        // });

        // this.postModel.schema.post('remove', function () {
        //     console.log(`POST-REMOVE: Post ${this._id} has been removed`);
        // });

        this.postModel.schema.pre('deleteOne', function () {
            console.log(`PRE-DELETE-ONE: Post being deleted with query:`, this.getQuery());
        });

        this.postModel.schema.post('deleteOne', function () {
            console.log(`POST-DELETE-ONE: Post deleted`);
        });

        this.postModel.schema.pre('deleteMany', function () {
            console.log(`PRE-DELETE-MANY: Posts being deleted with query:`, this.getQuery());
        });

        this.postModel.schema.post('deleteMany', function () {
            console.log(`POST-DELETE-MANY: Posts deleted`);
        });

        this.postModel.schema.pre('findOneAndDelete', function () {
            console.log(`PRE-FIND-ONE-AND-DELETE: Query:`, this.getQuery());
        });

        this.postModel.schema.post('findOneAndDelete', function () {
            console.log(`POST-FIND-ONE-AND-DELETE: Post deleted`);
        });

        this.postModel.schema.pre('findOneAndUpdate', function () {
            console.log(`PRE-FIND-ONE-AND-UPDATE: Query:`, this.getQuery());
            console.log(`Update:`, this.getUpdate());
        });

        this.postModel.schema.post('findOneAndUpdate', function (doc) {
            console.log(`POST-FIND-ONE-AND-UPDATE: Updated post ${doc?._id}`);
        });

        this.postModel.schema.pre('updateOne', function () {
            console.log(`PRE-UPDATE-ONE: Query:`, this.getQuery());
            console.log(`Update:`, this.getUpdate());
        });

        this.postModel.schema.post('updateOne', function () {
            console.log(`POST-UPDATE-ONE: Post updated`);
        });
    }

    private trackPost(postId: string, content: string) {
        this.postTracker.set(postId, {
            createdAt: new Date(),
            lastSeen: new Date(),
            content: content.substring(0, 100)
        });
        this.logger.log(`TRACKING: Started tracking post ${postId}`);
    }

    private updateTracker(postId: string) {
        const tracked = this.postTracker.get(postId);
        if (tracked) {
            tracked.lastSeen = new Date();
            this.logger.log(`TRACKING: Updated last seen for post ${postId}`);
        }
    }

    async create(createPostDto: CreatePostDto): Promise<Post> {
        const startTime = Date.now();
        this.logger.log(`=== STARTING POST CREATION ===`);
        this.logger.log(`User: ${createPostDto.userId}`);
        this.logger.log(`Content: ${createPostDto.content}`);

        try {
            const uploadedMediaUrls: string[] = [];

            // Upload images if provided
            if (createPostDto.images && createPostDto.images.length > 0) {
                this.logger.log(`Uploading ${createPostDto.images.length} images...`);
                for (const file of createPostDto.images) {
                    try {
                        const uploadResult = await this.cloudinaryService.uploadFile(
                            file,
                            `Posts/${createPostDto.userId}`
                        );
                        uploadedMediaUrls.push(uploadResult.secure_url);
                        this.logger.log(`Image uploaded: ${uploadResult.secure_url}`);
                    } catch (error) {
                        this.logger.error('Cloudinary upload error:', error);
                        throw new BadRequestException('Lỗi khi tải media lên Cloudinary');
                    }
                }
            }

            // Create the most minimal post possible
            const postData = {
                user: createPostDto.userId,
                userModel: createPostDto.userModel || 'User',
                content: createPostDto.content,
                media: uploadedMediaUrls,
                keywords: createPostDto.keywords || '',
                isHidden: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.logger.log(`Creating post with data:`, JSON.stringify(postData, null, 2));

            // Create and save
            const createdPost = new this.postModel(postData);
            this.logger.log(`Post model created, attempting to save...`);

            const savedPost = await createdPost.save();
            const saveTime = Date.now() - startTime;

            this.logger.log(`✅ POST SAVED SUCCESSFULLY in ${saveTime}ms`);
            this.logger.log(`Post ID: ${savedPost._id}`);
            this.logger.log(`Post content: ${savedPost.content}`);

            // Start tracking this post
            this.trackPost(savedPost._id.toString(), savedPost.content);

            // Immediate verification
            const verification1 = await this.postModel.findById(savedPost._id).lean();
            if (verification1) {
                this.logger.log(`✅ IMMEDIATE VERIFICATION 1 PASSED: Post ${savedPost._id} found`);
            } else {
                this.logger.error(`❌ IMMEDIATE VERIFICATION 1 FAILED: Post ${savedPost._id} NOT found`);
            }

            // Second verification after 1 second
            setTimeout(async () => {
                try {
                    const verification2 = await this.postModel.findById(savedPost._id).lean();
                    if (verification2) {
                        this.logger.log(`✅ VERIFICATION 2 (1s later) PASSED: Post ${savedPost._id} still exists`);
                    } else {
                        this.logger.error(`❌ VERIFICATION 2 (1s later) FAILED: Post ${savedPost._id} DISAPPEARED!`);
                        this.logPostDisappearance(savedPost._id.toString());
                    }
                } catch (error) {
                    this.logger.error(`Error in verification 2: ${error.message}`);
                }
            }, 1000);

            // Third verification after 10 seconds
            setTimeout(async () => {
                try {
                    const verification3 = await this.postModel.findById(savedPost._id).lean();
                    if (verification3) {
                        this.logger.log(`✅ VERIFICATION 3 (10s later) PASSED: Post ${savedPost._id} still exists`);
                        this.updateTracker(savedPost._id.toString());
                    } else {
                        this.logger.error(`❌ VERIFICATION 3 (10s later) FAILED: Post ${savedPost._id} DISAPPEARED!`);
                        this.logPostDisappearance(savedPost._id.toString());
                    }
                } catch (error) {
                    this.logger.error(`Error in verification 3: ${error.message}`);
                }
            }, 10000);

            // Fourth verification after 30 seconds
            setTimeout(async () => {
                try {
                    const verification4 = await this.postModel.findById(savedPost._id).lean();
                    if (verification4) {
                        this.logger.log(`✅ VERIFICATION 4 (30s later) PASSED: Post ${savedPost._id} still exists`);
                        this.updateTracker(savedPost._id.toString());
                    } else {
                        this.logger.error(`❌ VERIFICATION 4 (30s later) FAILED: Post ${savedPost._id} DISAPPEARED!`);
                        this.logPostDisappearance(savedPost._id.toString());
                    }
                } catch (error) {
                    this.logger.error(`Error in verification 4: ${error.message}`);
                }
            }, 30000);

            this.logger.log(`=== POST CREATION COMPLETED ===`);
            return savedPost;

        } catch (error) {
            this.logger.error('❌ ERROR IN POST CREATION:', error);
            this.logger.error('Stack trace:', error.stack);
            throw new InternalServerErrorException(`Lỗi khi tạo bài viết: ${error.message}`);
        }
    }

    private logPostDisappearance(postId: string) {
        const tracked = this.postTracker.get(postId);
        if (tracked) {
            const timeSinceCreation = Date.now() - tracked.createdAt.getTime();
            this.logger.error(`🚨 POST DISAPPEARED ANALYSIS:`);
            this.logger.error(`Post ID: ${postId}`);
            this.logger.error(`Content: ${tracked.content}`);
            this.logger.error(`Created at: ${tracked.createdAt.toISOString()}`);
            this.logger.error(`Last seen: ${tracked.lastSeen.toISOString()}`);
            this.logger.error(`Time since creation: ${timeSinceCreation}ms`);
        }
    }

    async getAll(limit: number, skip: number): Promise<{ posts: Post[]; hasMore: boolean; total: number }> {
        try {
            this.logger.log(`Getting all posts: limit=${limit}, skip=${skip}`);

            const total = await this.postModel.countDocuments({
                $or: [{ isHidden: false }, { isHidden: { $exists: false } }],
            });

            this.logger.log(`Total posts found: ${total}`);

            const posts = await this.postModel
                .find({ $or: [{ isHidden: false }, { isHidden: { $exists: false } }] })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'user',
                    select: 'name imageUrl avatarURL',
                })
                .lean()
                .exec();

            this.logger.log(`Retrieved ${posts.length} posts`);

            // Update tracker for found posts
            posts.forEach(post => {
                this.updateTracker(post._id.toString());
            });

            const hasMore = skip + posts.length < total;
            return { posts, hasMore, total };

        } catch (error) {
            this.logger.error('Error getting paginated posts:', error);
            throw new InternalServerErrorException('Lỗi khi lấy danh sách bài viết');
        }
    }

    async getOne(id: string): Promise<Post> {
        try {
            this.logger.log(`Getting post by ID: ${id}`);

            const post = await this.postModel
                .findById(id)
                .populate({
                    path: 'user',
                    select: 'name avatarURL',
                })
                .exec();

            if (!post) {
                this.logger.error(`Post ${id} not found`);
                // Check if we were tracking this post
                const tracked = this.postTracker.get(id);
                if (tracked) {
                    this.logger.error(`This post was being tracked! It definitely existed before.`);
                    this.logPostDisappearance(id);
                }
                throw new NotFoundException(`Không tìm thấy bài viết với id ${id}`);
            }

            this.logger.log(`Found post: ${post._id}`);
            this.updateTracker(id);
            return post;

        } catch (error) {
            this.logger.error('Error getting post:', error);
            throw new InternalServerErrorException('Lỗi khi lấy bài viết');
        }
    }

    async getByUserId(ownerId: string): Promise<Post[]> {
        try {
            this.logger.log(`Getting posts by user ID: ${ownerId}`);

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

            this.logger.log(`Found ${posts.length} posts for user ${ownerId}`);

            // Update tracker for found posts
            posts.forEach(post => {
                this.updateTracker(post._id.toString());
            });

            return posts;

        } catch (error) {
            this.logger.error('Error getting posts by owner:', error);
            throw new InternalServerErrorException('Lỗi khi lấy bài viết của người dùng');
        }
    }

    // Debug methods
    async checkPostExists(postId: string): Promise<{ exists: boolean; details?: any }> {
        try {
            const post = await this.postModel.findById(postId).lean();
            const tracked = this.postTracker.get(postId);

            return {
                exists: !!post,
                details: {
                    found: !!post,
                    tracked: !!tracked,
                    trackingInfo: tracked,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            this.logger.error(`Error checking post existence: ${error.message}`);
            return { exists: false, details: { error: error.message } };
        }
    }

    async getTrackingInfo(): Promise<any> {
        return {
            totalTracked: this.postTracker.size,
            posts: Array.from(this.postTracker.entries()).map(([id, info]) => ({
                id,
                ...info
            }))
        };
    }

    async forceCreateMinimalPost(content: string, userId: string): Promise<Post> {
        try {
            this.logger.log(`=== FORCE CREATING MINIMAL POST ===`);

            // The absolute minimum required
            const minimalData = {
                user: userId,
                content: content,
                isHidden: false,
                createdAt: new Date()
            };

            const post = await this.postModel.create(minimalData);
            this.logger.log(`Minimal post created with ID: ${post._id}`);

            this.trackPost(post._id.toString(), content);
            return post;

        } catch (error) {
            this.logger.error('Error creating minimal post:', error);
            throw error;
        }
    }

    // Temporarily disable all other methods that might interfere
    async update(id: string, updatePostDto: UpdatePostDto) {
        this.logger.log(`UPDATE TEMPORARILY DISABLED FOR DEBUGGING`);
        throw new BadRequestException('Update temporarily disabled for debugging');
    }

    async delete(id: string): Promise<{ message: string }> {
        this.logger.log(`DELETE TEMPORARILY DISABLED FOR DEBUGGING`);
        throw new BadRequestException('Delete temporarily disabled for debugging');
    }

    async search(query: string) {
        this.logger.log(`SEARCH TEMPORARILY DISABLED FOR DEBUGGING`);
        return [];
    }
}