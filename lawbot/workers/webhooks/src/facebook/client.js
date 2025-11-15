/**
 * Facebook Messenger API Client
 * Handles all interactions with Facebook Graph API
 */
export class MessengerClient {
    baseUrl = 'https://graph.facebook.com/v21.0';
    pageAccessToken;
    constructor(pageAccessToken) {
        this.pageAccessToken = pageAccessToken;
    }
    /**
     * Send a message to a recipient
     */
    async sendMessage(recipientId, message) {
        const url = `${this.baseUrl}/me/messages?access_token=${this.pageAccessToken}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`FB API error: ${error.error?.message || 'Unknown error'}`);
        }
    }
    /**
     * Send a text message
     */
    async sendTextMessage(recipientId, text) {
        await this.sendMessage(recipientId, { text });
    }
    /**
     * Send a message with quick replies
     */
    async sendQuickReply(recipientId, text, quickReplies) {
        const quick_replies = quickReplies.map((qr) => ({
            content_type: 'text',
            title: qr.title,
            payload: qr.payload,
            image_url: qr.imageUrl,
        }));
        await this.sendMessage(recipientId, { text, quick_replies });
    }
    /**
     * Send typing indicator ON
     */
    async sendTypingOn(recipientId) {
        await this.sendAction(recipientId, 'typing_on');
    }
    /**
     * Send typing indicator OFF
     */
    async sendTypingOff(recipientId) {
        await this.sendAction(recipientId, 'typing_off');
    }
    /**
     * Mark message as seen
     */
    async sendMarkSeen(recipientId) {
        await this.sendAction(recipientId, 'mark_seen');
    }
    /**
     * Send sender action (typing, mark_seen)
     */
    async sendAction(recipientId, action) {
        const url = `${this.baseUrl}/me/messages?access_token=${this.pageAccessToken}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: { id: recipientId },
                sender_action: action,
            }),
        });
        if (!response.ok) {
            console.error(`Failed to send action ${action}:`, await response.text());
        }
    }
    /**
     * Get user profile information
     */
    async getUserProfile(userId) {
        const url = `${this.baseUrl}/${userId}?fields=first_name,last_name,profile_pic&access_token=${this.pageAccessToken}`;
        const response = await fetch(url);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to get user profile: ${error.error?.message || 'Unknown error'}`);
        }
        return response.json();
    }
    /**
     * Send an attachment (image, video, audio, file)
     */
    async sendAttachment(recipientId, type, url) {
        await this.sendMessage(recipientId, {
            attachment: {
                type,
                payload: {
                    url,
                    is_reusable: true,
                },
            },
        });
    }
    /**
     * Set Messenger Profile (menu, greeting, etc.)
     */
    async setMessengerProfile(profile) {
        const url = `${this.baseUrl}/me/messenger_profile?access_token=${this.pageAccessToken}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profile),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to set messenger profile: ${error.error?.message || 'Unknown error'}`);
        }
    }
    /**
     * Delete Messenger Profile fields
     */
    async deleteMessengerProfile(fields) {
        const url = `${this.baseUrl}/me/messenger_profile?access_token=${this.pageAccessToken}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fields }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to delete messenger profile: ${error.error?.message || 'Unknown error'}`);
        }
    }
}
