/**
 * @lawbot/shared
 * Shared utilities and types
 */
export const version = '0.1.0';
/**
 * Format date to ISO string
 */
export function formatDate(date) {
    return date.toISOString();
}
/**
 * Generate unique ID
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
