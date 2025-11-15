/**
 * AnalyticsAggregator Durable Object
 * Aggregates real-time metrics and analytics
 * Writes to D1 database periodically for persistence
 */
export class AnalyticsAggregator {
    state;
    env;
    metrics;
    lastAggregation;
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.metrics = new Map();
        this.lastAggregation = null;
        // Restore state from storage
        this.state.blockConcurrencyWhile(async () => {
            const stored = await this.state.storage.get('analytics');
            if (stored) {
                this.metrics = new Map(stored.metrics);
                this.lastAggregation = stored.lastAggregation ? new Date(stored.lastAggregation) : null;
            }
            // Schedule first aggregation alarm
            const nextHour = this.getNextHourTimestamp();
            await this.state.storage.setAlarm(nextHour);
        });
    }
    async fetch(request) {
        const url = new URL(request.url);
        const path = url.pathname;
        try {
            switch (true) {
                case path === '/increment' && request.method === 'POST':
                    return await this.handleIncrement(request);
                case path === '/stats' && request.method === 'GET':
                    return this.handleStats();
                case path === '/reset' && request.method === 'POST':
                    return await this.handleReset();
                case path === '/metrics' && request.method === 'GET':
                    return this.handleMetrics();
                default:
                    return new Response('Not found', { status: 404 });
            }
        }
        catch (error) {
            return Response.json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, { status: 500 });
        }
    }
    /**
     * Increment a metric counter
     */
    async handleIncrement(request) {
        const update = await request.json();
        if (!update.name) {
            return Response.json({ success: false, error: 'Missing metric name' }, { status: 400 });
        }
        const value = update.value || 1;
        const existing = this.metrics.get(update.name);
        const metric = {
            count: (existing?.count || 0) + value,
            lastUpdated: new Date().toISOString(),
        };
        this.metrics.set(update.name, metric);
        await this.persistState();
        return Response.json({
            success: true,
            metric: update.name,
            count: metric.count,
        });
    }
    /**
     * Get current statistics
     */
    handleStats() {
        const stats = {
            metrics: Object.fromEntries(this.metrics),
            hourlySnapshot: null,
            lastAggregation: this.lastAggregation?.toISOString() || null,
        };
        return Response.json(stats);
    }
    /**
     * Get specific metrics
     */
    handleMetrics() {
        const metricsArray = Array.from(this.metrics.entries()).map(([name, metric]) => ({
            name,
            ...metric,
        }));
        return Response.json({
            metrics: metricsArray,
            total: metricsArray.length,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Reset all metrics
     */
    async handleReset() {
        this.metrics.clear();
        await this.persistState();
        return Response.json({
            success: true,
            message: 'All metrics reset',
        });
    }
    /**
     * Alarm handler - aggregates metrics every hour
     */
    async alarm() {
        try {
            await this.aggregateMetrics();
            // Schedule next aggregation
            const nextHour = this.getNextHourTimestamp();
            await this.state.storage.setAlarm(nextHour);
        }
        catch (error) {
            console.error('Error in analytics aggregation alarm:', error);
        }
    }
    /**
     * Aggregate metrics and write to D1 database
     */
    async aggregateMetrics() {
        if (this.metrics.size === 0) {
            return;
        }
        const timestamp = new Date().toISOString();
        const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
        try {
            // Check if DB binding exists
            if (!this.env.DB) {
                console.warn('DB binding not available, skipping D1 write');
                this.lastAggregation = new Date();
                await this.persistState();
                return;
            }
            // Prepare batch insert
            const values = [];
            const params = [];
            for (const [name, metric] of this.metrics.entries()) {
                values.push('(?, ?, ?, ?)');
                params.push(hour, name, metric.count, timestamp);
            }
            if (values.length > 0) {
                const query = `
          INSERT INTO analytics_hourly (hour, metric_name, value, recorded_at)
          VALUES ${values.join(', ')}
          ON CONFLICT (hour, metric_name)
          DO UPDATE SET
            value = value + excluded.value,
            recorded_at = excluded.recorded_at
        `;
                await this.env.DB.prepare(query).bind(...params).run();
            }
            this.lastAggregation = new Date();
            await this.persistState();
            console.log(`Aggregated ${this.metrics.size} metrics for hour ${hour}`);
        }
        catch (error) {
            console.error('Error writing to D1:', error);
        }
    }
    /**
     * Persist state to storage
     */
    async persistState() {
        await this.state.storage.put('analytics', {
            metrics: Array.from(this.metrics.entries()),
            lastAggregation: this.lastAggregation?.toISOString() || null,
        });
    }
    /**
     * Get next hour timestamp for alarm
     */
    getNextHourTimestamp() {
        const now = new Date();
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);
        return nextHour.getTime();
    }
}
