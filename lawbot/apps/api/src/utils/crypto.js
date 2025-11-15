/**
 * Cryptography utilities for Cloudflare Workers
 */
/**
 * Hash password using PBKDF2
 */
export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    // Generate random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    // Import key material
    const keyMaterial = await crypto.subtle.importKey('raw', data, { name: 'PBKDF2' }, false, ['deriveBits']);
    // Derive key using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits({
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
    }, keyMaterial, 256);
    // Combine salt and hash
    const hashArray = new Uint8Array(derivedBits);
    const combined = new Uint8Array(salt.length + hashArray.length);
    combined.set(salt);
    combined.set(hashArray, salt.length);
    // Convert to base64
    let binaryString = '';
    for (let i = 0; i < combined.length; i++) {
        binaryString += String.fromCharCode(combined[i]);
    }
    return btoa(binaryString);
}
/**
 * Verify password against hash
 */
export async function verifyPassword(password, hash) {
    try {
        // Decode base64 hash
        const combined = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
        // Extract salt (first 16 bytes) and stored hash
        const salt = combined.slice(0, 16);
        const storedHash = combined.slice(16);
        // Hash the password with the same salt
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const keyMaterial = await crypto.subtle.importKey('raw', data, { name: 'PBKDF2' }, false, ['deriveBits']);
        const derivedBits = await crypto.subtle.deriveBits({
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256',
        }, keyMaterial, 256);
        const computedHash = new Uint8Array(derivedBits);
        // Compare hashes
        if (computedHash.length !== storedHash.length) {
            return false;
        }
        for (let i = 0; i < computedHash.length; i++) {
            if (computedHash[i] !== storedHash[i]) {
                return false;
            }
        }
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Generate random token
 */
export function generateToken(length = 32) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
