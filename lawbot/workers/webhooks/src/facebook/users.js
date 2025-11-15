/**
 * Facebook User Management
 * Handle user creation and retrieval for Messenger users
 */
/**
 * Get or create a Facebook Messenger user
 * Stores fb_id in metadata JSON field
 */
export async function getOrCreateFBUser(fbUserId, client, env) {
    // Check if user exists by searching metadata for fb_id
    const existingUser = await env.DB.prepare(`SELECT * FROM users
     WHERE platform = 'messenger'
     AND json_extract(metadata, '$.fb_id') = ?
     LIMIT 1`)
        .bind(fbUserId)
        .first();
    if (existingUser) {
        // Update last_active timestamp
        await env.DB.prepare(`UPDATE users
       SET last_active = unixepoch()
       WHERE id = ?`)
            .bind(existingUser.id)
            .run();
        return existingUser;
    }
    // User doesn't exist, create new user
    try {
        // Get profile from Facebook
        const profile = await client.getUserProfile(fbUserId);
        const userId = generateUserId();
        const fullName = `${profile.first_name} ${profile.last_name}`.trim();
        const metadata = JSON.stringify({
            fb_id: fbUserId,
            profile_pic: profile.profile_pic,
            first_name: profile.first_name,
            last_name: profile.last_name,
        });
        // Insert new user
        const result = await env.DB.prepare(`INSERT INTO users (
        id, name, platform, created_at, last_active, metadata
      ) VALUES (?, ?, 'messenger', unixepoch(), unixepoch(), ?)
      RETURNING *`)
            .bind(userId, fullName, metadata)
            .first();
        if (!result) {
            throw new Error('Failed to create user');
        }
        console.log(`Created new FB user: ${userId} (${fullName})`);
        return result;
    }
    catch (error) {
        console.error('Error creating FB user:', error);
        // If profile fetch fails, create user with minimal info
        const userId = generateUserId();
        const metadata = JSON.stringify({ fb_id: fbUserId });
        const result = await env.DB.prepare(`INSERT INTO users (
        id, name, platform, created_at, last_active, metadata
      ) VALUES (?, ?, 'messenger', unixepoch(), unixepoch(), ?)
      RETURNING *`)
            .bind(userId, `FB User ${fbUserId.slice(-6)}`, metadata)
            .first();
        if (!result) {
            throw new Error('Failed to create user with fallback');
        }
        return result;
    }
}
/**
 * Generate a unique user ID
 */
function generateUserId() {
    return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
/**
 * Get user by Facebook ID
 */
export async function getUserByFBId(fbUserId, env) {
    const user = await env.DB.prepare(`SELECT * FROM users
     WHERE platform = 'messenger'
     AND json_extract(metadata, '$.fb_id') = ?
     LIMIT 1`)
        .bind(fbUserId)
        .first();
    return user || null;
}
/**
 * Update user's last active timestamp
 */
export async function updateUserActivity(userId, env) {
    await env.DB.prepare(`UPDATE users
     SET last_active = unixepoch()
     WHERE id = ?`)
        .bind(userId)
        .run();
}
