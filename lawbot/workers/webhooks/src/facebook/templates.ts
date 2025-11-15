/**
 * Facebook Messenger Message Templates
 * Pre-defined messages and formatting utilities
 */

import type { MessengerClient } from './client';
import type { Citation } from './types';

/**
 * Send welcome message with quick reply options
 */
export async function sendWelcomeMessage(
  recipientId: string,
  client: MessengerClient,
  firstName?: string
): Promise<void> {
  const greeting = firstName ? `Chào ${firstName}` : 'Xin chào';

  const welcomeText = `${greeting}! Tôi là trợ lý tư vấn pháp luật AI. 🎯

Tôi có thể hỗ trợ bạn:
✅ Giải đáp thắc mắc pháp lý
✅ Tìm kiếm văn bản luật
✅ Tư vấn quy trình pháp lý

Hãy chọn một chủ đề hoặc gửi câu hỏi của bạn!`;

  await client.sendQuickReply(recipientId, welcomeText, [
    { title: '⚖️ Luật Dân Sự', payload: 'CATEGORY_CIVIL' },
    { title: '💼 Luật Lao Động', payload: 'CATEGORY_LABOR' },
    { title: '🏢 Luật Doanh Nghiệp', payload: 'CATEGORY_BUSINESS' },
    { title: '📋 Câu Hỏi Khác', payload: 'CUSTOM_QUESTION' },
  ]);
}

/**
 * Send legal categories quick reply
 */
export async function sendLegalCategories(
  recipientId: string,
  client: MessengerClient
): Promise<void> {
  const text = `📚 Danh mục pháp luật:

Chọn lĩnh vực bạn quan tâm:`;

  await client.sendQuickReply(recipientId, text, [
    { title: '⚖️ Luật Dân Sự', payload: 'CATEGORY_CIVIL' },
    { title: '⚡ Luật Hình Sự', payload: 'CATEGORY_CRIMINAL' },
    { title: '💼 Luật Lao Động', payload: 'CATEGORY_LABOR' },
    { title: '🏢 Luật Doanh Nghiệp', payload: 'CATEGORY_BUSINESS' },
    { title: '🏠 Luật Đất Đai', payload: 'CATEGORY_LAND' },
    { title: '👨‍👩‍👧 Luật Hôn Nhân & Gia Đình', payload: 'CATEGORY_FAMILY' },
    { title: '💰 Luật Thuế', payload: 'CATEGORY_TAX' },
    { title: '🔙 Quay Lại', payload: 'GET_STARTED' },
  ]);
}

/**
 * Send contact information
 */
export async function sendContactInfo(
  recipientId: string,
  client: MessengerClient
): Promise<void> {
  const text = `📞 Thông tin liên hệ:

🌐 Website: https://lawbot.vn
📧 Email: contact@lawbot.vn
☎️ Hotline: 1900-xxxx
⏰ Giờ làm việc: 8:00 - 17:00 (T2-T6)

Chúng tôi sẵn sàng hỗ trợ bạn!`;

  await client.sendTextMessage(recipientId, text);
}

/**
 * Send category-specific message
 */
export async function sendCategoryMessage(
  recipientId: string,
  category: string,
  client: MessengerClient
): Promise<void> {
  const categoryInfo: Record<string, { title: string; description: string }> = {
    CATEGORY_CIVIL: {
      title: '⚖️ Luật Dân Sự',
      description: 'Quy định về quyền, nghĩa vụ của cá nhân, tổ chức. Bao gồm: quyền sở hữu, hợp đồng, thừa kế, bồi thường thiệt hại...',
    },
    CATEGORY_CRIMINAL: {
      title: '⚡ Luật Hình Sự',
      description: 'Quy định về tội phạm và hình phạt. Bao gồm: các loại tội, mức hình phạt, trách nhiệm hình sự...',
    },
    CATEGORY_LABOR: {
      title: '💼 Luật Lao Động',
      description: 'Quy định về quan hệ lao động, quyền và nghĩa vụ của người lao động và người sử dụng lao động.',
    },
    CATEGORY_BUSINESS: {
      title: '🏢 Luật Doanh Nghiệp',
      description: 'Quy định về thành lập, tổ chức, hoạt động và giải thể doanh nghiệp.',
    },
    CATEGORY_LAND: {
      title: '🏠 Luật Đất Đai',
      description: 'Quy định về quyền sử dụng đất, chuyển nhượng, thừa kế quyền sử dụng đất.',
    },
    CATEGORY_FAMILY: {
      title: '👨‍👩‍👧 Luật Hôn Nhân & Gia Đình',
      description: 'Quy định về hôn nhân, gia đình, nuôi con, ly hôn, phân chia tài sản...',
    },
    CATEGORY_TAX: {
      title: '💰 Luật Thuế',
      description: 'Quy định về nghĩa vụ thuế của cá nhân và doanh nghiệp.',
    },
  };

  const info = categoryInfo[category];
  if (!info) {
    await client.sendTextMessage(
      recipientId,
      'Danh mục không tồn tại. Vui lòng chọn lại.'
    );
    return;
  }

  const text = `${info.title}

${info.description}

Bạn có thể đặt câu hỏi cụ thể về lĩnh vực này!`;

  await client.sendTextMessage(recipientId, text);
}

/**
 * Send formatted response with citations
 */
export async function sendFormattedResponse(
  recipientId: string,
  answer: string,
  citations: Citation[],
  client: MessengerClient
): Promise<void> {
  // Split long messages (FB limit: 2000 chars)
  const chunks = splitMessage(answer, 1800);

  // Send message chunks
  for (let i = 0; i < chunks.length; i++) {
    await client.sendTextMessage(recipientId, chunks[i]);

    // Add delay between messages to avoid rate limits
    if (i < chunks.length - 1) {
      await sleep(500);
    }
  }

  // Send citations if available
  if (citations.length > 0) {
    const citationText = formatCitations(citations);
    await client.sendTextMessage(recipientId, citationText);
  }

  // Add disclaimer
  await sleep(300);
  await client.sendTextMessage(
    recipientId,
    '⚠️ Lưu ý: Thông tin chỉ mang tính tham khảo. Vui lòng tham khảo chuyên gia pháp lý cho vấn đề cụ thể.'
  );
}

/**
 * Format citations for display
 */
function formatCitations(citations: Citation[]): string {
  let text = '📚 Nguồn tham khảo:\n\n';

  citations.slice(0, 5).forEach((c, index) => {
    const confidence = Math.round(c.confidence * 100);
    text += `${index + 1}. ${c.law} - ${c.article} (${confidence}%)\n`;
  });

  return text;
}

/**
 * Split message into chunks respecting word boundaries
 */
function splitMessage(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph + '\n\n';
    } else {
      currentChunk += paragraph + '\n\n';
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Helper function to sleep/delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send error message
 */
export async function sendErrorMessage(
  recipientId: string,
  client: MessengerClient
): Promise<void> {
  const text = `⚠️ Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn.

Vui lòng thử lại sau hoặc liên hệ với chúng tôi để được hỗ trợ.`;

  await client.sendTextMessage(recipientId, text);
}
