/**
 * Zalo Message Templates
 * Vietnamese language support for legal consultation
 */
/**
 * Pre-defined message templates
 */
export const messageTemplates = {
    welcome: {
        id: 'welcome_template',
        text: `Chào mừng bạn đến với Tư Vấn Pháp Luật AI! 🎯

Tôi có thể giúp bạn:
✅ Giải đáp thắc mắc pháp lý
✅ Tìm kiếm văn bản luật
✅ Tư vấn các vấn đề pháp lý

Hãy gửi câu hỏi của bạn hoặc chọn một trong các tùy chọn bên dưới.`,
    },
    legalCategories: {
        id: 'legal_categories',
        text: 'Vui lòng chọn lĩnh vực pháp luật bạn quan tâm:',
        quickReplies: [
            { title: '⚖️ Luật Dân Sự', payload: 'category_civil' },
            { title: '💼 Luật Lao Động', payload: 'category_labor' },
            { title: '🏢 Luật Doanh Nghiệp', payload: 'category_business' },
            { title: '🏠 Luật Đất Đai', payload: 'category_land' },
            { title: '📋 Khác', payload: 'category_other' },
        ],
    },
    disclaimer: {
        text: `⚠️ Lưu ý: Thông tin được cung cấp bởi AI chỉ mang tính tham khảo. Vui lòng tham khảo ý kiến chuyên gia pháp lý cho các vấn đề quan trọng.`,
    },
    errorMessages: {
        generalError: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        invalidInput: 'Xin lỗi, tôi không hiểu yêu cầu của bạn. Vui lòng gửi lại câu hỏi.',
        serviceUnavailable: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau ít phút.',
        rateLimitExceeded: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ một chút trước khi tiếp tục.',
    },
    acknowledgments: {
        received: 'Đã nhận được câu hỏi của bạn. Đang xử lý...',
        processing: 'Đang tìm kiếm thông tin pháp lý liên quan...',
    },
};
/**
 * Format legal response with citations and disclaimer
 *
 * @param answer - AI-generated answer
 * @param citations - Legal document citations
 * @returns Formatted response message
 */
export function formatLegalResponse(answer, citations) {
    let response = answer + '\n\n';
    // Add citations if available
    if (citations && citations.length > 0) {
        response += '📚 *Nguồn tham khảo:*\n';
        citations.forEach((c) => {
            response += `• ${c.law} - Điều ${c.article}`;
            if (c.relevance) {
                response += ` (${(c.relevance * 100).toFixed(0)}% liên quan)`;
            }
            response += '\n';
        });
        response += '\n';
    }
    // Add disclaimer
    response += messageTemplates.disclaimer.text;
    return response;
}
/**
 * Format error message
 *
 * @param errorType - Type of error
 * @returns User-friendly error message
 */
export function formatErrorMessage(errorType) {
    return messageTemplates.errorMessages[errorType];
}
/**
 * Create quick reply suggestions
 *
 * @param suggestions - Array of suggestion texts
 * @returns Quick reply options
 */
export function createQuickReplies(suggestions) {
    return suggestions.slice(0, 5).map((text) => ({
        title: text.length > 20 ? text.substring(0, 17) + '...' : text,
        payload: `question_${text.substring(0, 50)}`,
    }));
}
/**
 * Create category selection message
 *
 * @returns Message with category quick replies
 */
export function getCategorySelectionMessage() {
    return {
        text: messageTemplates.legalCategories.text,
        quickReplies: messageTemplates.legalCategories.quickReplies,
    };
}
/**
 * Create welcome message
 *
 * @returns Welcome message text
 */
export function getWelcomeMessage() {
    return messageTemplates.welcome.text;
}
