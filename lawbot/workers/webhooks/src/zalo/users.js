/**
 * Zalo User Management
 * Handle user creation and retrieval
 */
import { generateId } from '@lawbot/shared';
/**
 * Get or create user from Zalo ID
 *
 * @param zaloUserId - Zalo user ID
 * @param platform - Platform identifier
 * @param db - D1 database instance
 * @param zaloClient - Zalo API client
 * @returns User object
 */
export async function getOrCreateUser(zaloUserId, platform, db, zaloClient) {
    // Check if user exists in database
    const existingUser = await db
        .prepare(`
    SELECT id, phone, email, name, platform, created_at, last_active, metadata
    FROM users
    WHERE id = ? AND platform = ?
  `)
        .bind(zaloUserId, platform)
        .first();
    if (existingUser) {
        // Update last active timestamp
        await db
            .prepare(`
      UPDATE users
      SET last_active = unixepoch()
      WHERE id = ?
    `)
            .bind(existingUser.id)
            .run();
        return existingUser;
    }
    // User doesn't exist, fetch info from Zalo and create
    try {
        const userInfo = await zaloClient.getUserInfo(zaloUserId);
        const newUser = {
            id: zaloUserId,
            phone: userInfo.user_phone,
            email: undefined,
            name: userInfo.display_name || 'Zalo User',
            platform,
            created_at: Math.floor(Date.now() / 1000),
            last_active: Math.floor(Date.now() / 1000),
            metadata: JSON.stringify({
                avatar: userInfo.user_avatar,
                source: 'zalo',
            }),
        };
        // Insert into database
        await db
            .prepare(`
      INSERT INTO users (id, phone, email, name, platform, created_at, last_active, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
            .bind(newUser.id, newUser.phone || null, newUser.email || null, newUser.name, newUser.platform, newUser.created_at, newUser.last_active, newUser.metadata)
            .run();
        return newUser;
    }
    catch (error) {
        console.error('Error fetching user info from Zalo:', error);
        // Fallback: create user with minimal info
        const fallbackUser = {
            id: zaloUserId,
            phone: undefined,
            email: undefined,
            name: 'Zalo User',
            platform,
            created_at: Math.floor(Date.now() / 1000),
            last_active: Math.floor(Date.now() / 1000),
            metadata: JSON.stringify({
                source: 'zalo',
                incomplete: true,
            }),
        };
        await db
            .prepare(`
      INSERT INTO users (id, phone, email, name, platform, created_at, last_active, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
            .bind(fallbackUser.id, null, null, fallbackUser.name, fallbackUser.platform, fallbackUser.created_at, fallbackUser.last_active, fallbackUser.metadata)
            .run();
        return fallbackUser;
    }
}
/**
 * Get or create conversation for user
 *
 * @param userId - User ID
 * @param platform - Platform identifier
 * @param db - D1 database instance
 * @returns Conversation ID
 */
export async function getOrCreateConversation(userId, platform, db) {
    // Check for active conversation
    const activeConv = await db
        .prepare(`
    SELECT id FROM conversations
    WHERE user_id = ? AND platform = ? AND status = 'active'
    ORDER BY updated_at DESC
    LIMIT 1
  `)
        .bind(userId, platform)
        .first();
    if (activeConv) {
        // Update conversation timestamp
        await db
            .prepare(`
      UPDATE conversations
      SET updated_at = unixepoch()
      WHERE id = ?
    `)
            .bind(activeConv.id)
            .run();
        return activeConv.id;
    }
    // Create new conversation
    const conversationId = generateId();
    await db
        .prepare(`
    INSERT INTO conversations (id, user_id, platform, status, created_at, updated_at, metadata)
    VALUES (?, ?, ?, 'active', unixepoch(), unixepoch(), '{}')
  `)
        .bind(conversationId, userId, platform)
        .run();
    return conversationId;
}
/**
 * Store message in database
 *
 * @param conversationId - Conversation ID
 * @param role - Message role (user/assistant/system)
 * @param content - Message content
 * @param sources - Optional legal sources
 * @param db - D1 database instance
 * @returns Message ID
 */
export async function storeMessage(conversationId, role, content, sources, db) {
    const messageId = generateId();
    await db
        .prepare(`
    INSERT INTO messages (id, conversation_id, role, content, sources, created_at)
    VALUES (?, ?, ?, ?, ?, unixepoch())
  `)
        .bind(messageId, conversationId, role, content, sources)
        .run();
    return messageId;
}
