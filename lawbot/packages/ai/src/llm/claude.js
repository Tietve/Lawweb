/**
 * Claude 3.5 Sonnet integration for Vietnamese legal queries
 */
export class ClaudeModel {
    apiKey;
    config = {
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 4096,
        temperature: 0.3,
        apiVersion: '2023-06-01',
    };
    constructor(apiKey) {
        this.apiKey = apiKey;
        if (!apiKey) {
            throw new Error('Claude API key is required');
        }
    }
    /**
     * Generate streaming response from Claude
     */
    async generate(request) {
        const messages = this.buildMessages(request);
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': this.config.apiVersion,
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages,
                    max_tokens: this.config.maxTokens,
                    temperature: this.config.temperature,
                    stream: request.stream ?? true,
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Claude API error: ${response.status} - ${error}`);
            }
            return response;
        }
        catch (error) {
            console.error('Claude API error:', error);
            throw error;
        }
    }
    /**
     * Build messages array with system prompt and context
     */
    buildMessages(request, context) {
        const messages = [];
        // Add system message
        messages.push({
            role: 'system',
            content: this.buildSystemPrompt(context),
        });
        // Add conversation history if available
        if (context?.history && context.history.length > 0) {
            messages.push(...context.history.slice(-5)); // Last 5 messages
        }
        // Add current query with RAG context
        messages.push({
            role: 'user',
            content: this.buildUserMessage(request.query, context),
        });
        return messages;
    }
    /**
     * Build system prompt for Vietnamese legal assistant
     */
    buildSystemPrompt(context) {
        return `Bạn là trợ lý pháp lý AI chuyên về luật Việt Nam. Nhiệm vụ của bạn là:

1. Cung cấp thông tin pháp lý chính xác dựa trên luật pháp Việt Nam
2. Trích dẫn cụ thể các điều luật, khoản, và điểm liên quan
3. Giải thích rõ ràng, dễ hiểu cho người dân
4. Luôn khuyến cáo người dùng tham khảo luật sư nếu cần tư vấn cụ thể

QUY TẮC QUAN TRỌNG:
- Chỉ sử dụng thông tin từ các văn bản pháp luật được cung cấp
- Không đưa ra lời khuyên pháp lý cụ thể cho trường hợp riêng
- Trả lời bằng tiếng Việt trừ khi được yêu cầu khác
- Nếu không chắc chắn, hãy nói rõ và khuyên tham khảo chuyên gia
- Luôn trích dẫn nguồn: [Tên luật - Điều X, Khoản Y]

${context?.documents && context.documents.length > 0 ? 'CÁC VĂN BẢN PHÁP LUẬT LIÊN QUAN đã được cung cấp trong tin nhắn của người dùng.' : ''}`;
    }
    /**
     * Build user message with RAG context
     */
    buildUserMessage(query, context) {
        if (!context?.documents || context.documents.length === 0) {
            return query;
        }
        let message = 'CÁC VĂN BẢN PHÁP LUẬT LIÊN QUAN:\n\n';
        for (const doc of context.documents) {
            const lawCode = doc.source.law_code || 'N/A';
            const article = doc.source.article || 'N/A';
            const confidence = (doc.confidence * 100).toFixed(1);
            message += `[${lawCode} - Điều ${article}] (Độ tin cậy: ${confidence}%)\n`;
            message += `${doc.content}\n\n`;
        }
        message += `---\n\nCÂU HỎI CỦA NGƯỜI DÙNG:\n${query}`;
        return message;
    }
    /**
     * Parse streaming response from Claude
     */
    async *parseStream(response) {
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }
        const decoder = new TextDecoder();
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]')
                            continue;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.type === 'content_block_delta') {
                                yield parsed.delta?.text || '';
                            }
                        }
                        catch {
                            // Ignore parse errors
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
}
