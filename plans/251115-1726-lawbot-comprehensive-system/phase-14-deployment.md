# Phase 14: Deployment & Launch

## Context Links
- [Parent Plan](plan.md)
- [Prev: Testing QA](phase-13-testing-qa.md)

## Overview
- **Date**: 2025-11-15
- **Description**: Production deployment and system launch
- **Priority**: P3 - Final phase
- **Implementation Status**: 🔴 Not Started
- **Review Status**: 🔴 Not Started

## Key Insights
- Zero-downtime deployment required
- Rollback strategy essential
- Monitoring before launch
- Gradual rollout recommended
- Documentation critical

## Requirements

### Functional
- CI/CD pipeline setup
- Environment configuration
- Database migrations
- Service deployments
- Monitoring setup
- Documentation complete

### Non-functional
- Zero downtime deployment
- <5 min rollback capability
- 99.9% uptime SLA
- Real-time monitoring
- Automated backups

## Architecture

```
deployment/
├── ci-cd/
│   ├── github-actions/
│   └── deployment-scripts/
├── monitoring/
│   ├── cloudflare-analytics/
│   └── custom-dashboards/
├── infrastructure/
│   └── terraform/
└── docs/
    └── runbooks/
```

## Related Code Files

### Create
- `/.github/workflows/deploy.yml` - CI/CD pipeline
- `/deployment/scripts/deploy.sh` - Deployment script
- `/deployment/scripts/rollback.sh` - Rollback script
- `/deployment/terraform/main.tf` - Infrastructure as code
- `/docs/runbooks/incident-response.md` - Incident runbook

## Implementation Steps

1. **GitHub Actions CI/CD Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Run security audit
        run: npm audit --audit-level=high

  deploy-workers:
    needs: test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        worker:
          - api
          - chatbot
          - webhooks
          - publisher
          - durable-objects

    steps:
      - uses: actions/checkout@v3

      - name: Deploy ${{ matrix.worker }} Worker
        run: |
          cd workers/${{ matrix.worker }}
          npx wrangler deploy --env production

      - name: Smoke test
        run: |
          curl -f https://${{ matrix.worker }}.lawbot.vn/health || exit 1

  deploy-pages:
    needs: test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app:
          - web-public
          - web-admin
          - chat-widget

    steps:
      - uses: actions/checkout@v3

      - name: Build ${{ matrix.app }}
        run: |
          cd apps/${{ matrix.app }}
          npm run build

      - name: Deploy to Cloudflare Pages
        run: |
          npx wrangler pages deploy dist \
            --project-name=${{ matrix.app }} \
            --branch=main

  database-migration:
    needs: [deploy-workers, deploy-pages]
    runs-on: ubuntu-latest
    steps:
      - name: Run D1 migrations
        run: |
          npx wrangler d1 migrations apply lawbot-db --env production
          npx wrangler d1 migrations apply lawbot-archive --env production
          npx wrangler d1 migrations apply lawbot-analytics --env production

  post-deployment:
    needs: database-migration
    runs-on: ubuntu-latest
    steps:
      - name: Purge CDN cache
        run: |
          curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CF_ZONE_ID }}/purge_cache" \
            -H "Authorization: Bearer ${{ secrets.CF_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}'

      - name: Run E2E tests
        run: npm run test:e2e:prod

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

2. **Deployment Script**
```bash
#!/bin/bash
# deployment/scripts/deploy.sh

set -e

echo "🚀 Starting deployment to production..."

# Configuration
ENV="production"
ROLLBACK_ENABLED=true

# Pre-deployment checks
echo "📋 Running pre-deployment checks..."
npm run test:ci
npm audit --audit-level=high

# Backup current state
if [ "$ROLLBACK_ENABLED" = true ]; then
  echo "💾 Creating backup..."
  ./scripts/backup.sh
fi

# Deploy Workers
echo "⚡ Deploying Workers..."
for worker in api chatbot webhooks publisher; do
  echo "  Deploying $worker..."
  (cd workers/$worker && wrangler deploy --env $ENV)
done

# Deploy Durable Objects
echo "🔄 Deploying Durable Objects..."
(cd workers/durable-objects && wrangler deploy --env $ENV)

# Deploy Pages
echo "📄 Deploying Pages applications..."
for app in web-public web-admin chat-widget; do
  echo "  Building and deploying $app..."
  (cd apps/$app && npm run build && wrangler pages deploy dist --project-name=$app)
done

# Run database migrations
echo "🗄️ Running database migrations..."
wrangler d1 migrations apply lawbot-db --env $ENV
wrangler d1 migrations apply lawbot-archive --env $ENV
wrangler d1 migrations apply lawbot-analytics --env $ENV

# Update Vectorize indexes
echo "🔍 Updating Vectorize indexes..."
node scripts/update-vectorize.js

# Health checks
echo "❤️ Running health checks..."
./scripts/health-check.sh

echo "✅ Deployment completed successfully!"
```

3. **Rollback Script**
```bash
#!/bin/bash
# deployment/scripts/rollback.sh

set -e

echo "⚠️ Starting rollback..."

# Get previous deployment ID
PREV_DEPLOYMENT=$(wrangler deployments list --env production | head -2 | tail -1 | awk '{print $1}')

if [ -z "$PREV_DEPLOYMENT" ]; then
  echo "❌ No previous deployment found!"
  exit 1
fi

echo "📦 Rolling back to deployment: $PREV_DEPLOYMENT"

# Rollback Workers
for worker in api chatbot webhooks publisher; do
  echo "  Rolling back $worker..."
  wrangler rollback $PREV_DEPLOYMENT --env production --yes
done

# Rollback database if needed
read -p "Rollback database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  wrangler d1 migrations list lawbot-db --env production
  # Implement database rollback logic
fi

# Clear cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

echo "✅ Rollback completed!"
```

4. **Monitoring Setup**
```typescript
// deployment/monitoring/setup.ts
export async function setupMonitoring(env: Env) {
  // Cloudflare Analytics
  await configureAnalytics({
    zones: [env.CF_ZONE_ID],
    metrics: [
      'requests',
      'bandwidth',
      'threats',
      'pageviews',
      'unique_visitors'
    ],
    alerting: {
      email: 'ops@lawbot.vn',
      thresholds: {
        errorRate: 0.05,
        responseTime: 2000,
        availability: 0.999
      }
    }
  });

  // Custom metrics
  await createCustomDashboard({
    name: 'LawBot Operations',
    widgets: [
      {
        type: 'line',
        title: 'Chat Sessions',
        metric: 'chat_sessions_total'
      },
      {
        type: 'gauge',
        title: 'Active Users',
        metric: 'active_users_current'
      },
      {
        type: 'histogram',
        title: 'Response Times',
        metric: 'ai_response_duration'
      },
      {
        type: 'counter',
        title: 'API Calls',
        metric: 'api_requests_total'
      }
    ]
  });

  // Log aggregation
  await setupLogDrain({
    destination: 'https://logs.lawbot.vn',
    format: 'json',
    includeMetadata: true
  });
}
```

5. **Health Check System**
```typescript
// deployment/scripts/health-check.ts
interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  details?: any;
}

export async function runHealthChecks(): Promise<HealthCheckResult[]> {
  const services = [
    { name: 'API', url: 'https://api.lawbot.vn/health' },
    { name: 'Web Public', url: 'https://lawbot.vn' },
    { name: 'Web Admin', url: 'https://admin.lawbot.vn' },
    { name: 'Chat Widget', url: 'https://chat.lawbot.vn/health' },
    { name: 'Zalo Webhook', url: 'https://api.lawbot.vn/webhooks/zalo/health' },
    { name: 'FB Webhook', url: 'https://api.lawbot.vn/webhooks/facebook/health' }
  ];

  const results = await Promise.all(
    services.map(async service => {
      const start = Date.now();

      try {
        const response = await fetch(service.url, {
          signal: AbortSignal.timeout(5000)
        });

        return {
          service: service.name,
          status: response.ok ? 'healthy' : 'degraded',
          latency: Date.now() - start,
          details: await response.json()
        };
      } catch (error) {
        return {
          service: service.name,
          status: 'unhealthy',
          latency: Date.now() - start,
          details: { error: error.message }
        };
      }
    })
  );

  // Check database
  const dbHealth = await checkDatabase();
  results.push(dbHealth);

  // Check Vectorize
  const vectorHealth = await checkVectorize();
  results.push(vectorHealth);

  return results;
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    const result = await DB.prepare('SELECT 1').first();

    return {
      service: 'D1 Database',
      status: result ? 'healthy' : 'unhealthy',
      latency: Date.now() - start
    };
  } catch (error) {
    return {
      service: 'D1 Database',
      status: 'unhealthy',
      latency: Date.now() - start,
      details: { error: error.message }
    };
  }
}
```

6. **Environment Configuration**
```toml
# wrangler.toml
name = "lawbot-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }
kv_namespaces = [
  { binding = "SESSIONS", id = "xxx-sessions-prod" },
  { binding = "RATE_LIMIT", id = "xxx-ratelimit-prod" }
]
d1_databases = [
  { binding = "DB", database_name = "lawbot-db", database_id = "xxx-db-prod" }
]
vectorize = [
  { binding = "VECTORIZE_INDEX", index_name = "legal-docs-index" }
]
durable_objects.bindings = [
  { name = "NOTIFICATION_HUB", class_name = "NotificationHub" },
  { name = "ANALYTICS_DO", class_name = "AnalyticsAggregator" }
]

[env.staging]
vars = { ENVIRONMENT = "staging" }
# Staging configuration...
```

7. **Launch Checklist**
```markdown
# deployment/launch-checklist.md

## Pre-Launch (T-7 days)
- [ ] Complete all testing phases
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Backup procedures tested
- [ ] Rollback procedures tested

## Pre-Launch (T-3 days)
- [ ] Final staging deployment
- [ ] Load testing at scale
- [ ] Platform integration testing (Zalo, FB)
- [ ] Legal compliance review
- [ ] Support team trained

## Pre-Launch (T-1 day)
- [ ] DNS records configured
- [ ] SSL certificates active
- [ ] Monitoring dashboards ready
- [ ] Alert channels configured
- [ ] On-call schedule set

## Launch Day
- [ ] 08:00 - Final health checks
- [ ] 09:00 - Deploy to production
- [ ] 09:30 - Smoke tests
- [ ] 10:00 - Gradual traffic migration (10%)
- [ ] 11:00 - Monitor metrics
- [ ] 12:00 - Increase traffic (50%)
- [ ] 14:00 - Full traffic migration
- [ ] 16:00 - Post-launch review

## Post-Launch
- [ ] Monitor for 24 hours
- [ ] Gather initial feedback
- [ ] Performance analysis
- [ ] Bug triage
- [ ] Documentation updates
```

## Todo List
- [ ] Setup CI/CD pipeline
- [ ] Create deployment scripts
- [ ] Implement rollback procedure
- [ ] Configure monitoring
- [ ] Setup alerting
- [ ] Create health checks
- [ ] Prepare environments
- [ ] Document procedures
- [ ] Train operations team
- [ ] Execute launch plan
- [ ] Post-launch monitoring

## Success Criteria
- Zero-downtime deployment achieved
- All health checks passing
- Monitoring operational
- <5 min rollback tested
- Documentation complete

## Risk Assessment
- **Risk**: Deployment failure
- **Mitigation**: Rollback procedure, staged rollout
- **Risk**: Traffic spike
- **Mitigation**: Auto-scaling, rate limiting

## Security Considerations
- Secrets management via CI/CD
- Production access controls
- Audit logging enabled
- Security headers configured

## Next Steps
- Monitor production metrics
- Gather user feedback
- Plan iteration 2
- Optimize performance
- Scale infrastructure

## Unresolved Questions
1. Disaster recovery plan details?
2. Data backup frequency and retention?
3. SLA commitments to users?
4. Incident escalation procedures?
5. Compliance certification timeline?