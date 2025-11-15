/**
 * Zalo Signature Verification
 * Implements HMAC-SHA256 signature verification for Zalo webhooks
 */
/**
 * Verify Zalo webhook signature
 * Signature format: mac={SHA256(app_id + body + timestamp + secret_key)}
 *
 * @param body - Raw request body
 * @param signature - X-ZEvent-Signature header value
 * @param secretKey - Zalo app secret key
 * @returns True if signature is valid
 */
export async function verifyZaloSignature(body, signature, secretKey) {
    try {
        // Parse webhook data
        const data = JSON.parse(body);
        const { app_id, timestamp } = data;
        if (!app_id || !timestamp) {
            console.error('Missing app_id or timestamp in webhook data');
            return false;
        }
        // Construct signature data: app_id + body + timestamp + secret_key
        const signatureData = app_id + body + timestamp + secretKey;
        // Calculate SHA256 hash
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(signatureData);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        // Convert to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        // Expected signature format: mac={hash}
        const expectedSignature = `mac=${hashHex}`;
        // Constant-time comparison to prevent timing attacks
        return timingSafeEqual(expectedSignature, signature);
    }
    catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}
/**
 * Timing-safe string comparison
 * Prevents timing attacks by ensuring constant-time comparison
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}
