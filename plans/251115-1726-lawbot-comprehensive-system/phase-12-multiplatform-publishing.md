# Phase 12: Multi-platform Publishing System

## Context Links
- [Parent Plan](plan.md)
- [Research: Multi-platform](research/researcher-02-multiplatform-integrations.md)
- [Prev: FB Integration](phase-11-messenger-integration.md)
- [Next: Testing QA](phase-13-testing-qa.md)

## Overview
- **Date**: 2025-11-15
- **Description**: Automated content publishing to Web, Facebook, and Zalo
- **Priority**: P2 - Content distribution
- **Implementation Status**: 🔴 Not Started
- **Review Status**: 🔴 Not Started

## Key Insights
- Facebook: 63,206 char limit
- Zalo: Template messages
- Circuit breaker pattern needed
- Platform-specific formatting
- Scheduling capabilities required

## Requirements

### Functional
- Content creation interface
- Multi-platform formatting
- Scheduled publishing
- Media handling
- Analytics tracking
- Failure recovery

### Non-functional
- Atomic publishing
- Retry mechanisms
- Audit logging
- Performance monitoring
- Rollback capability

## Architecture

```
workers/publisher/
├── orchestrator.ts    # Publishing orchestrator
├── platforms/
│   ├── web.ts        # Web publishing
│   ├── facebook.ts   # FB Graph API
│   └── zalo.ts       # Zalo publishing
├── scheduler.ts       # Cron scheduling
└── formatter.ts       # Content formatting
```

## Related Code Files

### Create
- `/workers/publisher/orchestrator.ts` - Main orchestrator
- `/workers/publisher/platforms/web.ts` - Web publisher
- `/workers/publisher/platforms/facebook.ts` - FB publisher
- `/workers/publisher/platforms/zalo.ts` - Zalo publisher
- `/workers/publisher/scheduler.ts` - Scheduler

## Implementation Steps

1. **Publishing Orchestrator**
```typescript
// workers/publisher/orchestrator.ts
export class PublishingOrchestrator {
  private publishers: Map<Platform, Publisher> = new Map([
    ['web', new WebPublisher()],
    ['facebook', new FacebookPublisher()],
    ['zalo', new ZaloPublisher()]
  ]);

  async publish(content: Content, options: PublishOptions): Promise<PublishResult> {
    const { platforms, scheduled, retryStrategy } = options;

    // Schedule if needed
    if (scheduled) {
      return this.schedulePublish(content, options);
    }

    // Publish immediately
    const results = await this.publishToPlatforms(content, platforms);

    // Handle failures
    const failed = results.filter(r => r.status === 'failed');
    if (failed.length > 0 && retryStrategy) {
      await this.handleRetries(failed, retryStrategy);
    }

    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      content,
      platforms: results,
      success: failed.length === 0
    };
  }

  private async publishToPlatforms(
    content: Content,
    platforms: Platform[]
  ): Promise<PlatformResult[]> {
    const promises = platforms.map(async platform => {
      try {
        const publisher = this.publishers.get(platform);
        const formatted = await this.formatContent(content, platform);
        const result = await publisher.publish(formatted);

        return {
          platform,
          status: 'success',
          postId: result.id,
          url: result.url
        };
      } catch (error) {
        return {
          platform,
          status: 'failed',
          error: error.message
        };
      }
    });

    return Promise.allSettled(promises).then(results =>
      results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    );
  }

  private async formatContent(
    content: Content,
    platform: Platform
  ): Promise<FormattedContent> {
    const formatter = new ContentFormatter();
    return formatter.format(content, platform);
  }

  private async schedulePublish(
    content: Content,
    options: PublishOptions
  ): Promise<PublishResult> {
    const scheduler = new PublishingScheduler();
    const jobId = await scheduler.schedule(content, options);

    return {
      id: jobId,
      scheduled: true,
      scheduledTime: options.scheduled,
      content
    };
  }
}
```

2. **Web Publisher**
```typescript
// workers/publisher/platforms/web.ts
export class WebPublisher implements Publisher {
  async publish(content: FormattedContent): Promise<PublishResponse> {
    // Save to D1 database
    const post = await this.saveToDatabase(content);

    // Invalidate cache
    await this.invalidateCache();

    // Trigger static regeneration
    await this.triggerRegeneration();

    return {
      id: post.id,
      url: `https://lawbot.vn/blog/${post.slug}`,
      platform: 'web'
    };
  }

  private async saveToDatabase(content: FormattedContent) {
    const db = getDB();

    return db.prepare(`
      INSERT INTO blog_posts (
        title, slug, content, excerpt,
        featured_image, category, tags,
        published_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      RETURNING *
    `).bind(
      content.title,
      this.generateSlug(content.title),
      content.body,
      content.excerpt,
      content.featuredImage,
      content.category,
      JSON.stringify(content.tags)
    ).first();
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async invalidateCache() {
    // Purge Cloudflare cache
    await fetch('https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: [
          'https://lawbot.vn/blog',
          'https://lawbot.vn/api/posts'
        ]
      })
    });
  }
}
```

3. **Facebook Publisher**
```typescript
// workers/publisher/platforms/facebook.ts
export class FacebookPublisher implements Publisher {
  private graphUrl = 'https://graph.facebook.com/v16.0';

  async publish(content: FormattedContent): Promise<PublishResponse> {
    const { pageId, accessToken } = await this.getCredentials();

    // Handle media upload first
    let mediaIds = [];
    if (content.media) {
      mediaIds = await this.uploadMedia(content.media, pageId, accessToken);
    }

    // Publish post
    const response = await fetch(
      `${this.graphUrl}/${pageId}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: this.formatMessage(content),
          attached_media: mediaIds.map(id => ({ media_fbid: id })),
          published: !content.scheduled,
          scheduled_publish_time: content.scheduled
            ? Math.floor(new Date(content.scheduled).getTime() / 1000)
            : undefined,
          access_token: accessToken
        })
      }
    );

    const result = await response.json();

    if (result.error) {
      throw new Error(`Facebook API: ${result.error.message}`);
    }

    return {
      id: result.id,
      url: `https://facebook.com/${result.id}`,
      platform: 'facebook'
    };
  }

  private formatMessage(content: FormattedContent): string {
    let message = content.body;

    // Add hashtags
    if (content.hashtags) {
      message += '\n\n' + content.hashtags.map(h => `#${h}`).join(' ');
    }

    // Facebook character limit: 63,206
    if (message.length > 63000) {
      message = message.substring(0, 62990) + '... (tiếp)';
    }

    return message;
  }

  private async uploadMedia(
    media: Media[],
    pageId: string,
    accessToken: string
  ): Promise<string[]> {
    const ids = [];

    for (const item of media) {
      if (item.type === 'image') {
        const response = await fetch(
          `${this.graphUrl}/${pageId}/photos`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: item.url,
              published: false,
              access_token: accessToken
            })
          }
        );

        const result = await response.json();
        ids.push(result.id);
      }
    }

    return ids;
  }
}
```

4. **Zalo Publisher**
```typescript
// workers/publisher/platforms/zalo.ts
export class ZaloPublisher implements Publisher {
  private apiUrl = 'https://openapi.zalo.me/v3.0';

  async publish(content: FormattedContent): Promise<PublishResponse> {
    const accessToken = await this.getAccessToken();
    const oaId = await this.getOAId();

    // Zalo uses broadcast API for mass messaging
    const response = await fetch(
      `${this.apiUrl}/oa/message/broadcast`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': accessToken
        },
        body: JSON.stringify({
          recipient: {
            target: 'all' // Or specific user list
          },
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'media',
                elements: [{
                  media_type: 'article',
                  attachment_id: await this.createArticle(content, accessToken)
                }]
              }
            }
          }
        })
      }
    );

    const result = await response.json();

    if (result.error) {
      throw new Error(`Zalo API: ${result.message}`);
    }

    return {
      id: result.data.broadcast_id,
      url: `zalo://broadcast/${result.data.broadcast_id}`,
      platform: 'zalo'
    };
  }

  private async createArticle(
    content: FormattedContent,
    accessToken: string
  ): Promise<string> {
    // Create article in Zalo
    const response = await fetch(
      `${this.apiUrl}/article/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': accessToken
        },
        body: JSON.stringify({
          type: 'normal',
          title: content.title,
          author: 'LawBot AI',
          cover: {
            cover_type: 'photo',
            photo_url: content.featuredImage,
            status: 'show'
          },
          description: content.excerpt,
          body: this.formatZaloBody(content.body),
          status: 'show'
        })
      }
    );

    const result = await response.json();
    return result.data.id;
  }

  private formatZaloBody(body: string): any[] {
    // Zalo requires structured body format
    const paragraphs = body.split('\n\n');

    return paragraphs.map(p => ({
      type: 'text',
      content: p
    }));
  }
}
```

5. **Content Formatter**
```typescript
// workers/publisher/formatter.ts
export class ContentFormatter {
  format(content: Content, platform: Platform): FormattedContent {
    const formatter = this.getFormatter(platform);
    return formatter(content);
  }

  private getFormatter(platform: Platform): Formatter {
    const formatters = {
      web: this.formatForWeb,
      facebook: this.formatForFacebook,
      zalo: this.formatForZalo
    };

    return formatters[platform] || this.defaultFormatter;
  }

  private formatForWeb(content: Content): FormattedContent {
    return {
      ...content,
      body: this.convertToHTML(content.body),
      excerpt: this.generateExcerpt(content.body, 160),
      slug: this.generateSlug(content.title),
      seo: {
        title: content.title,
        description: this.generateExcerpt(content.body, 160),
        keywords: content.tags
      }
    };
  }

  private formatForFacebook(content: Content): FormattedContent {
    return {
      ...content,
      body: this.stripHTML(content.body),
      hashtags: this.generateHashtags(content.tags),
      callToAction: {
        type: 'LEARN_MORE',
        link: content.url
      }
    };
  }

  private formatForZalo(content: Content): FormattedContent {
    return {
      ...content,
      body: this.convertToZaloFormat(content.body),
      excerpt: this.generateExcerpt(content.body, 100)
    };
  }

  private generateHashtags(tags: string[]): string[] {
    return tags.map(tag =>
      tag.replace(/\s+/g, '')
        .replace(/[^a-zA-Z0-9_]/g, '')
    );
  }
}
```

6. **Publishing Scheduler**
```typescript
// workers/publisher/scheduler.ts
export class PublishingScheduler {
  async schedule(
    content: Content,
    options: PublishOptions
  ): Promise<string> {
    const jobId = crypto.randomUUID();

    // Store in D1
    await this.storeScheduledJob(jobId, content, options);

    // Create Cloudflare Cron Trigger
    if (options.recurring) {
      await this.createCronTrigger(jobId, options.cronExpression);
    } else {
      await this.scheduleOneTime(jobId, options.scheduled);
    }

    return jobId;
  }

  private async storeScheduledJob(
    jobId: string,
    content: Content,
    options: PublishOptions
  ) {
    const db = getDB();

    await db.prepare(`
      INSERT INTO scheduled_posts (
        id, content, platforms, scheduled_time,
        status, created_at
      ) VALUES (?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(
      jobId,
      JSON.stringify(content),
      JSON.stringify(options.platforms),
      options.scheduled
    ).run();
  }

  async executeScheduledJobs() {
    const db = getDB();

    // Get pending jobs
    const jobs = await db.prepare(`
      SELECT * FROM scheduled_posts
      WHERE status = 'pending'
      AND scheduled_time <= datetime('now')
    `).all();

    const orchestrator = new PublishingOrchestrator();

    for (const job of jobs.results) {
      try {
        const content = JSON.parse(job.content);
        const platforms = JSON.parse(job.platforms);

        await orchestrator.publish(content, {
          platforms,
          scheduled: false
        });

        // Update status
        await db.prepare(`
          UPDATE scheduled_posts
          SET status = 'completed', completed_at = datetime('now')
          WHERE id = ?
        `).bind(job.id).run();
      } catch (error) {
        // Update with error
        await db.prepare(`
          UPDATE scheduled_posts
          SET status = 'failed', error = ?
          WHERE id = ?
        `).bind(error.message, job.id).run();
      }
    }
  }
}

// Cron handler
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const scheduler = new PublishingScheduler();
    await scheduler.executeScheduledJobs();
  }
};
```

7. **Circuit Breaker & Retry**
```typescript
// workers/publisher/resilience.ts
export class CircuitBreaker {
  private failures = new Map<string, number>();
  private lastFailureTime = new Map<string, number>();
  private state = new Map<string, 'closed' | 'open' | 'half-open'>();

  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    options: CircuitBreakerOptions = {}
  ): Promise<T> {
    const {
      threshold = 5,
      timeout = 60000,
      resetTimeout = 120000
    } = options;

    const currentState = this.state.get(key) || 'closed';

    if (currentState === 'open') {
      const lastFailure = this.lastFailureTime.get(key) || 0;
      if (Date.now() - lastFailure > resetTimeout) {
        this.state.set(key, 'half-open');
      } else {
        throw new Error(`Circuit breaker open for ${key}`);
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);

      // Reset on success
      if (currentState === 'half-open') {
        this.reset(key);
      }

      return result;
    } catch (error) {
      this.recordFailure(key);

      const failureCount = this.failures.get(key) || 0;
      if (failureCount >= threshold) {
        this.state.set(key, 'open');
        this.lastFailureTime.set(key, Date.now());
      }

      throw error;
    }
  }

  private recordFailure(key: string) {
    const current = this.failures.get(key) || 0;
    this.failures.set(key, current + 1);
  }

  private reset(key: string) {
    this.failures.delete(key);
    this.lastFailureTime.delete(key);
    this.state.set(key, 'closed');
  }
}
```

## Todo List
- [ ] Create publishing orchestrator
- [ ] Implement web publisher
- [ ] Build Facebook publisher
- [ ] Create Zalo publisher
- [ ] Setup content formatter
- [ ] Implement scheduler
- [ ] Add circuit breaker
- [ ] Create retry logic
- [ ] Build admin UI
- [ ] Test multi-platform flow
- [ ] Monitor publishing metrics

## Success Criteria
- All platforms publish successfully
- Scheduled posts work
- Failures handled gracefully
- Formatting platform-specific
- Analytics tracked

## Risk Assessment
- **Risk**: Platform API failures
- **Mitigation**: Circuit breaker, retries
- **Risk**: Rate limiting
- **Mitigation**: Queue, backoff strategy

## Security Considerations
- Secure API credentials
- Content validation
- XSS prevention in web
- Audit all publications

## Next Steps
- Phase 13: Testing & QA
- Phase 14: Deployment