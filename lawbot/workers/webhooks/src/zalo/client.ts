/**
 * Zalo API Client
 * Handles communication with Zalo Official Account API
 */

import type { ZaloQuickReplyOption } from '@lawbot/shared';

/**
 * Zalo API client for sending messages and managing OA
 */
export class ZaloClient {
  private baseUrl = 'https://openapi.zalo.me/v3.0';
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private _appId: string,
    private _secretKey: string,
    private _oaId: string,
    private kv?: KVNamespace
  ) {}

  /**
   * Send text message to user
   *
   * @param userId - Zalo user ID
   * @param message - Message text
   * @returns Promise resolving to API response
   */
  async sendMessage(userId: string, message: string): Promise<void> {
    await this.ensureValidToken();

    const response = await fetch(`${this.baseUrl}/oa/message/cs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: this.accessToken!,
      },
      body: JSON.stringify({
        recipient: {
          user_id: userId,
        },
        message: {
          text: message,
        },
      }),
    });

    const result = (await response.json()) as {
      error?: number;
      message?: string;
    };
    if (result.error !== 0 && result.error) {
      throw new Error(`Zalo API error: ${result.message || result.error}`);
    }
  }

  /**
   * Send message with quick replies
   *
   * @param userId - Zalo user ID
   * @param message - Message text
   * @param options - Quick reply options
   */
  async sendQuickReply(
    userId: string,
    message: string,
    options: ZaloQuickReplyOption[]
  ): Promise<void> {
    await this.ensureValidToken();

    const quickReplies = options.map((opt) => ({
      content_type: 'text',
      title: opt.title,
      payload: opt.payload,
      ...(opt.icon && { image_icon: opt.icon }),
    }));

    const response = await fetch(`${this.baseUrl}/oa/message/cs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: this.accessToken!,
      },
      body: JSON.stringify({
        recipient: { user_id: userId },
        message: {
          text: message,
          quick_replies: quickReplies,
        },
      }),
    });

    const result = (await response.json()) as {
      error?: number;
      message?: string;
    };
    if (result.error !== 0 && result.error) {
      throw new Error(`Quick reply error: ${result.message || result.error}`);
    }
  }

  /**
   * Get user information from Zalo
   *
   * @param userId - Zalo user ID
   * @returns User info object
   */
  async getUserInfo(userId: string): Promise<{
    user_id: string;
    display_name: string;
    user_phone?: string;
    user_avatar?: string;
  }> {
    await this.ensureValidToken();

    const response = await fetch(
      `${this.baseUrl}/oa/getprofile?data=${JSON.stringify({ user_id: userId })}`,
      {
        method: 'GET',
        headers: {
          access_token: this.accessToken!,
        },
      }
    );

    const result = (await response.json()) as {
      error?: number;
      message?: string;
      data: {
        user_id: string;
        display_name: string;
        user_phone?: string;
        user_avatar?: string;
      };
    };
    if (result.error !== 0 && result.error) {
      throw new Error(`Get user info error: ${result.message || result.error}`);
    }

    return result.data;
  }

  /**
   * Send typing indicator
   *
   * @param userId - Zalo user ID
   */
  async sendTypingIndicator(userId: string): Promise<void> {
    await this.ensureValidToken();

    await fetch(`${this.baseUrl}/oa/message/cs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: this.accessToken!,
      },
      body: JSON.stringify({
        recipient: { user_id: userId },
        sender_action: 'typing_on',
      }),
    });
  }

  /**
   * Ensure access token is valid, refresh if needed
   */
  private async ensureValidToken(): Promise<void> {
    // Check if token exists and is not expired
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return;
    }

    // Try to get cached token from KV
    if (this.kv) {
      const cached = await this.kv.get('zalo_access_token', 'json');
      if (cached && typeof cached === 'object' && 'token' in cached) {
        const { token, expiry } = cached as { token: string; expiry: number };
        if (Date.now() < expiry) {
          this.accessToken = token;
          this.tokenExpiry = expiry;
          return;
        }
      }
    }

    // Refresh token
    await this.refreshAccessToken();
  }

  /**
   * Refresh access token from Zalo
   * Note: In production, you need to implement OAuth flow
   * This is a placeholder for the token refresh logic
   */
  private async refreshAccessToken(): Promise<void> {
    // In production, implement proper OAuth 2.0 flow
    // For now, we assume token is provided via environment variables
    // This should be replaced with actual token refresh logic

    // Placeholder: In real implementation, you would:
    // 1. Get refresh token from secure storage
    // 2. Call Zalo token refresh endpoint
    // 3. Store new token and refresh token

    throw new Error(
      'Token refresh not implemented. Please provide access token via KV or implement OAuth flow.'
    );
  }

  /**
   * Set access token manually (for testing or manual token management)
   *
   * @param token - Access token
   * @param expiresIn - Token expiry in seconds
   */
  async setAccessToken(token: string, expiresIn: number = 7200): Promise<void> {
    this.accessToken = token;
    this.tokenExpiry = Date.now() + expiresIn * 1000;

    // Cache in KV if available
    if (this.kv) {
      await this.kv.put(
        'zalo_access_token',
        JSON.stringify({
          token,
          expiry: this.tokenExpiry,
        }),
        {
          expirationTtl: expiresIn,
        }
      );
    }
  }
}

/**
 * Create Zalo client instance
 *
 * @param appId - Zalo app ID
 * @param secretKey - Zalo secret key
 * @param oaId - Official Account ID
 * @param kv - KV namespace for caching
 * @returns Zalo client instance
 */
export function createZaloClient(
  appId: string,
  secretKey: string,
  oaId: string,
  kv?: KVNamespace
): ZaloClient {
  return new ZaloClient(appId, secretKey, oaId, kv);
}
