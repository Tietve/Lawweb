'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
export function useAnalytics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 60000);
        return () => clearInterval(interval);
    }, []);
    const loadStats = async () => {
        try {
            const data = await api.get('/api/v1/admin/analytics/stats');
            setStats(data);
        }
        catch (error) {
            console.error('Failed to load analytics:', error);
        }
        finally {
            setLoading(false);
        }
    };
    return { stats, loading, refresh: loadStats };
}
