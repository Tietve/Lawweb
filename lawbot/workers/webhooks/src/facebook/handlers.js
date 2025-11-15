/**
 * Facebook Messenger Event Handlers
 * Process messages, postbacks, and quick replies
 */
import { sendWelcomeMessage, sendLegalCategories, sendContactInfo, sendCategoryMessage, sendFormattedResponse, sendErrorMessage, } from './templates';
import { getOrCreateFBUser } from './users';
/**
 * Handle incoming message event
 */
export async function handleMessage(event, client, env) {
    const senderId = event.sender.id;
    const message = event.message;
    if (!message)
        return;
    try {
        // Show typing indicator
        await client.sendTypingOn(senderId);
        // Get or create user
        const user = await getOrCreateFBUser(senderId, client, env);
        // Handle quick reply
        if (message.quick_reply) {
            await handleQuickReply(event, client, env);
            return;
        }
        // Handle text message
        if (message.text) {
            await handleTextMessage(senderId, message.text, user.id, client, env);
            return;
        }
        // Handle attachments
        if (message.attachments && message.attachments.length > 0) {
            await handleAttachments(senderId, message.attachments, client, env);
            return;
        }
        // Unknown message type
        await client.sendTextMessage(senderId, 'Xin lỗi, tôi chưa hỗ trợ loại tin nhắn này.');
    }
    catch (error) {
        console.error('Error handling message:', error);
        await sendErrorMessage(senderId, client);
    }
    finally {
        await client.sendTypingOff(senderId);
    }
}
/**
 * Handle text message with AI
 */
async function handleTextMessage(senderId, text, userId, client, env) {
    try {
        // Call chatbot worker for AI response
        const response = await env.CHATBOT.fetch(new Request('http://chatbot/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                message: text,
                platform: 'messenger',
            }),
        }));
        if (!response.ok) {
            throw new Error(`Chatbot error: ${response.status}`);
        }
        const result = await response.json();
        // Send formatted response
        await sendFormattedResponse(senderId, result.answer || 'Xin lỗi, tôi không thể xử lý câu hỏi này.', result.citations || [], client);
    }
    catch (error) {
        console.error('Error processing text message:', error);
        // Fallback response
        await client.sendTextMessage(senderId, 'Cảm ơn câu hỏi của bạn. Hiện tại hệ thống đang trong giai đoạn phát triển. Vui lòng thử lại sau.');
    }
}
/**
 * Handle attachments (images, files, etc.)
 */
async function handleAttachments(senderId, attachments, client, _env) {
    const attachment = attachments[0];
    if (attachment.type === 'image' && attachment.payload.url) {
        await client.sendTextMessage(senderId, '📸 Cảm ơn bạn đã gửi hình ảnh. Hiện tại tôi chưa hỗ trợ phân tích hình ảnh, nhưng bạn có thể mô tả vấn đề pháp lý của mình bằng văn bản.');
    }
    else if (attachment.type === 'location') {
        await client.sendTextMessage(senderId, '📍 Cảm ơn bạn đã chia sẻ vị trí. Bạn cần tư vấn pháp lý về vấn đề gì?');
    }
    else {
        await client.sendTextMessage(senderId, 'Tôi đã nhận được tệp đính kèm. Vui lòng mô tả vấn đề pháp lý của bạn bằng văn bản.');
    }
}
/**
 * Handle postback event (button clicks)
 */
export async function handlePostback(event, client, env) {
    const senderId = event.sender.id;
    const postback = event.postback;
    if (!postback)
        return;
    const payload = postback.payload;
    try {
        await client.sendTypingOn(senderId);
        // Get or create user
        const user = await getOrCreateFBUser(senderId, client, env);
        const metadata = JSON.parse(user.metadata);
        const firstName = metadata.first_name;
        switch (payload) {
            case 'GET_STARTED':
                await sendWelcomeMessage(senderId, client, firstName);
                break;
            case 'LEGAL_CATEGORIES':
                await sendLegalCategories(senderId, client);
                break;
            case 'CONTACT_HOTLINE':
            case 'CONTACT_EMAIL':
                await sendContactInfo(senderId, client);
                break;
            case 'CUSTOM_QUESTION':
                await client.sendTextMessage(senderId, 'Vui lòng nhập câu hỏi của bạn về pháp luật:');
                break;
            // Category selections
            case 'CATEGORY_CIVIL':
            case 'CATEGORY_CRIMINAL':
            case 'CATEGORY_LABOR':
            case 'CATEGORY_BUSINESS':
            case 'CATEGORY_LAND':
            case 'CATEGORY_FAMILY':
            case 'CATEGORY_TAX':
                await sendCategoryMessage(senderId, payload, client);
                break;
            default:
                console.log('Unknown postback payload:', payload);
                await client.sendTextMessage(senderId, 'Xin lỗi, tôi không hiểu yêu cầu này.');
        }
    }
    catch (error) {
        console.error('Error handling postback:', error);
        await sendErrorMessage(senderId, client);
    }
    finally {
        await client.sendTypingOff(senderId);
    }
}
/**
 * Handle quick reply event
 */
export async function handleQuickReply(event, client, env) {
    const senderId = event.sender.id;
    const quickReply = event.message?.quick_reply;
    if (!quickReply)
        return;
    const payload = quickReply.payload;
    try {
        await client.sendTypingOn(senderId);
        // Get or create user
        await getOrCreateFBUser(senderId, client, env);
        // Handle quick reply payloads (similar to postback)
        if (payload.startsWith('CATEGORY_')) {
            await sendCategoryMessage(senderId, payload, client);
        }
        else if (payload === 'CUSTOM_QUESTION') {
            await client.sendTextMessage(senderId, 'Vui lòng nhập câu hỏi của bạn về pháp luật:');
        }
        else if (payload === 'GET_STARTED') {
            const user = await getOrCreateFBUser(senderId, client, env);
            const metadata = JSON.parse(user.metadata);
            const firstName = metadata.first_name;
            await sendWelcomeMessage(senderId, client, firstName);
        }
        else {
            console.log('Unknown quick reply payload:', payload);
        }
    }
    catch (error) {
        console.error('Error handling quick reply:', error);
        await sendErrorMessage(senderId, client);
    }
    finally {
        await client.sendTypingOff(senderId);
    }
}
