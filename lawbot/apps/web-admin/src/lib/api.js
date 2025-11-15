const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
export class ApiClient {
    baseUrl;
    token = null;
    constructor(baseUrl = API_BASE) {
        this.baseUrl = baseUrl;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('admin_token');
        }
    }
    setToken(token) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('admin_token', token);
        }
    }
    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_token');
        }
    }
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
            ...options.headers,
        };
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    }
    async get(endpoint) {
        return this.request(endpoint);
    }
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    }
}
export const api = new ApiClient();
