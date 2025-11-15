/**
 * Facebook Messenger API Client
 * Handles all interactions with Facebook Graph API
 */

import type { MessagePayload, QuickReply, UserProfile } from './types';

interface FacebookError {
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
}

export class MessengerClient {
  private baseUrl = 'https://graph.facebook.com/v21.0';
  private pageAccessToken: string;

  constructor(pageAccessToken: string) {
    this.pageAccessToken = pageAccessToken;
  }

  /**
   * Send a message to a recipient
   */
  async sendMessage(
    recipientId: string,
    message: MessagePayload
  ): Promise<void> {
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
      const error = (await response.json()) as FacebookError;
      throw new Error(
        `FB API error: ${error.error?.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Send a text message
   */
  async sendTextMessage(recipientId: string, text: string): Promise<void> {
    await this.sendMessage(recipientId, { text });
  }

  /**
   * Send a message with quick replies
   */
  async sendQuickReply(
    recipientId: string,
    text: string,
    quickReplies: Array<{
      title: string;
      payload: string;
      imageUrl?: string;
    }>
  ): Promise<void> {
    const quick_replies: QuickReply[] = quickReplies.map((qr) => ({
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
  async sendTypingOn(recipientId: string): Promise<void> {
    await this.sendAction(recipientId, 'typing_on');
  }

  /**
   * Send typing indicator OFF
   */
  async sendTypingOff(recipientId: string): Promise<void> {
    await this.sendAction(recipientId, 'typing_off');
  }

  /**
   * Mark message as seen
   */
  async sendMarkSeen(recipientId: string): Promise<void> {
    await this.sendAction(recipientId, 'mark_seen');
  }

  /**
   * Send sender action (typing, mark_seen)
   */
  private async sendAction(
    recipientId: string,
    action: 'typing_on' | 'typing_off' | 'mark_seen'
  ): Promise<void> {
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
  async getUserProfile(userId: string): Promise<UserProfile> {
    const url = `${this.baseUrl}/${userId}?fields=first_name,last_name,profile_pic&access_token=${this.pageAccessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = (await response.json()) as FacebookError;
      throw new Error(
        `Failed to get user profile: ${error.error?.message || 'Unknown error'}`
      );
    }

    return response.json();
  }

  /**
   * Send an attachment (image, video, audio, file)
   */
  async sendAttachment(
    recipientId: string,
    type: 'image' | 'video' | 'audio' | 'file',
    url: string
  ): Promise<void> {
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
  async setMessengerProfile(profile: Record<string, unknown>): Promise<void> {
    const url = `${this.baseUrl}/me/messenger_profile?access_token=${this.pageAccessToken}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      const error = (await response.json()) as FacebookError;
      throw new Error(
        `Failed to set messenger profile: ${error.error?.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Delete Messenger Profile fields
   */
  async deleteMessengerProfile(fields: string[]): Promise<void> {
    const url = `${this.baseUrl}/me/messenger_profile?access_token=${this.pageAccessToken}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      const error = (await response.json()) as FacebookError;
      throw new Error(
        `Failed to delete messenger profile: ${error.error?.message || 'Unknown error'}`
      );
    }
  }
}
