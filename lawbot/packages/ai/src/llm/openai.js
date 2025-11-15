/**
 * OpenAI GPT-4 integration for Vietnamese legal queries
 */
export class OpenAIModel {
    apiKey;
    config = {
        model: 'gpt-4-turbo-preview',
        maxTokens: 4096,
        temperature: 0.3,
    };
    constructor(apiKey) {
        this.apiKey = apiKey;
        if (!apiKey) {
            throw new Error('OpenAI API key is required');
        }
    }
    /**
     * Generate streaming response from OpenAI
     */
    async generate(request) {
        const messages = this.buildMessages(request);
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
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
                throw new Error(`OpenAI API error: ${response.status} - ${error}`);
            }
            return response;
        }
        catch (error) {
            console.error('OpenAI API error:', error);
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
        return `Bạn là trợ lý pháp lý AI chuyên về luật Việt Nam.

NHIỆM VỤ:
1. Cung cấp thông tin pháp lý chính xác theo luật Việt Nam
2. Trích dẫn rõ ràng các điều luật, khoản, điểm
3. Giải thích dễ hiểu cho người dân
4. Khuyến cáo tham khảo luật sư cho tư vấn cụ thể

QUY TẮC:
- Chỉ dựa vào văn bản pháp luật được cung cấp
- Không tư vấn pháp lý cho trường hợp cụ thể
- Trả lời bằng tiếng Việt
- Thừa nhận khi không chắc chắn
- Luôn trích dẫn nguồn: [Tên luật - Điều X, Khoản Y]

${context?.documents && context.documents.length > 0 ? 'Các văn bản pháp luật liên quan đã được cung cấp trong tin nhắn người dùng.' : ''}`;
    }
    /**
     * Build user message with RAG context
     */
    buildUserMessage(query, context) {
        if (!context?.documents || context.documents.length === 0) {
            return query;
        }
        let message = 'VĂN BẢN PHÁP LUẬT LIÊN QUAN:\n\n';
        for (const doc of context.documents) {
            const lawCode = doc.source.law_code || 'N/A';
            const article = doc.source.article || 'N/A';
            const confidence = (doc.confidence * 100).toFixed(1);
            message += `[${lawCode} - Điều ${article}] (${confidence}%)\n`;
            message += `${doc.content}\n\n`;
        }
        message += `---\n\nCÂU HỎI:\n${query}`;
        return message;
    }
    /**
     * Parse streaming response from OpenAI
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
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                yield content;
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
