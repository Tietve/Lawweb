/**
 * Model Router - Intelligent routing between AI models
 * Routes to Claude for complex queries, Workers AI for simple ones
 */
import { ClaudeModel } from './claude';
import { OpenAIModel } from './openai';
import { WorkersAIModel } from './workers';
export class ModelRouter {
    models = {};
    config;
    constructor(config) {
        this.config = config;
        // Initialize available models
        if (config.claudeApiKey) {
            this.models.claude = new ClaudeModel(config.claudeApiKey);
        }
        if (config.openaiApiKey) {
            this.models.openai = new OpenAIModel(config.openaiApiKey);
        }
        if (config.workersAI) {
            this.models.workers = new WorkersAIModel(config.workersAI);
        }
    }
    /**
     * Route request to appropriate model based on query complexity
     */
    async route(request, context) {
        // Explicit high accuracy request -> Claude
        if (request.requiresHighAccuracy && this.models.claude) {
            return this.models.claude;
        }
        // Simple query -> Workers AI
        if (request.isSimpleQuery && this.models.workers) {
            return this.models.workers;
        }
        // Analyze query complexity
        const complexity = this.analyzeComplexity(request, context);
        if (complexity === 'high' && this.models.claude) {
            return this.models.claude;
        }
        if (complexity === 'low' && this.models.workers) {
            return this.models.workers;
        }
        // Medium complexity or fallback -> OpenAI or default
        if (this.models.openai) {
            return this.models.openai;
        }
        // Use default model
        const defaultModel = this.config.defaultModel || 'claude';
        const model = this.models[defaultModel];
        if (!model) {
            throw new Error('No AI model available');
        }
        return model;
    }
    /**
     * Route with automatic fallback on error
     */
    async routeWithFallback(request, context) {
        const primary = await this.route(request, context);
        const primaryType = this.getModelType(primary);
        try {
            return await primary.generate(request);
        }
        catch (error) {
            console.error(`Primary model (${primaryType}) failed:`, error);
            if (!this.config.enableFallback) {
                throw error;
            }
            // Try fallback models
            const fallback = this.getFallbackModel(primaryType);
            if (!fallback) {
                throw error;
            }
            console.log(`Falling back to ${this.getModelType(fallback)}`);
            try {
                return await fallback.generate(request);
            }
            catch (fallbackError) {
                console.error('Fallback model also failed:', fallbackError);
                throw fallbackError;
            }
        }
    }
    /**
     * Analyze query complexity
     */
    analyzeComplexity(request, context) {
        const query = request.query.toLowerCase();
        const queryLength = request.query.length;
        // High complexity indicators
        const highComplexityKeywords = [
            'phân tích',
            'so sánh',
            'đánh giá',
            'tư vấn',
            'tranh chấp',
            'khiếu nại',
            'khởi kiện',
            'bồi thường',
        ];
        const hasHighComplexity = highComplexityKeywords.some(keyword => query.includes(keyword));
        if (hasHighComplexity || queryLength > 200) {
            return 'high';
        }
        // Low complexity indicators
        const lowComplexityKeywords = [
            'là gì',
            'có phải',
            'được không',
            'như thế nào',
            'bao nhiêu',
            'khi nào',
            'ở đâu',
        ];
        const hasLowComplexity = lowComplexityKeywords.some(keyword => query.includes(keyword));
        if (hasLowComplexity && queryLength < 100) {
            return 'low';
        }
        // Check if we have strong RAG context
        if (context?.documents && context.documents.length > 0) {
            const topConfidence = context.documents[0]?.confidence || 0;
            if (topConfidence > 0.85 && queryLength < 150) {
                return 'low';
            }
        }
        return 'medium';
    }
    /**
     * Get fallback model for a given primary model
     */
    getFallbackModel(primaryType) {
        // Claude -> OpenAI -> Workers
        if (primaryType === 'claude') {
            return this.models.openai || this.models.workers || null;
        }
        // OpenAI -> Claude -> Workers
        if (primaryType === 'openai') {
            return this.models.claude || this.models.workers || null;
        }
        // Workers -> Claude -> OpenAI
        if (primaryType === 'workers') {
            return this.models.claude || this.models.openai || null;
        }
        return null;
    }
    /**
     * Get model type from model instance
     */
    getModelType(model) {
        if (model instanceof ClaudeModel)
            return 'claude';
        if (model instanceof OpenAIModel)
            return 'openai';
        if (model instanceof WorkersAIModel)
            return 'workers';
        return 'claude'; // Default
    }
}
