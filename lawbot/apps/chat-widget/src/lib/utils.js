export function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
