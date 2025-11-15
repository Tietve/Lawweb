# Phase 13: Testing & QA

## Context Links
- [Parent Plan](plan.md)
- [Prev: Publishing System](phase-12-multiplatform-publishing.md)
- [Next: Deployment](phase-14-deployment.md)

## Overview
- **Date**: 2025-11-15
- **Description**: Comprehensive testing and quality assurance
- **Priority**: P3 - Quality assurance
- **Implementation Status**: 🔴 Not Started
- **Review Status**: 🔴 Not Started

## Key Insights
- Edge runtime testing different
- Vietnamese language testing critical
- Load testing for 10K users
- Platform-specific testing needed
- Security testing essential

## Requirements

### Functional
- Unit testing all components
- Integration testing APIs
- E2E testing user flows
- Performance testing
- Security testing
- Accessibility testing

### Non-functional
- 90% code coverage
- <2s page load times
- Handle 10K concurrent users
- Zero critical vulnerabilities
- WCAG 2.1 AA compliance

## Architecture

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
├── performance/    # Load testing
├── security/      # Security tests
└── fixtures/      # Test data
```

## Related Code Files

### Create
- `/tests/unit/rag.test.ts` - RAG pipeline tests
- `/tests/integration/api.test.ts` - API tests
- `/tests/e2e/chat.test.ts` - Chat flow tests
- `/tests/performance/load.test.ts` - Load tests
- `/tests/security/auth.test.ts` - Security tests

## Implementation Steps

1. **Unit Testing Setup**
```typescript
// tests/unit/rag.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { LegalDocumentChunker } from '@/packages/ai/rag/chunker';
import { EmbeddingGenerator } from '@/packages/ai/rag/embeddings';

describe('RAG Pipeline', () => {
  describe('Document Chunker', () => {
    let chunker: LegalDocumentChunker;

    beforeEach(() => {
      chunker = new LegalDocumentChunker();
    });

    it('should chunk Vietnamese legal text correctly', async () => {
      const document = `Điều 123. Quyền sở hữu tài sản
      1. Chủ sở hữu có quyền chiếm hữu, sử dụng, định đoạt tài sản của mình.
      2. Quyền sở hữu tài sản được pháp luật bảo vệ.`;

      const chunks = await chunker.chunk(document);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].metadata.article).toBe('123');
      expect(chunks[0].tokens).toBeLessThanOrEqual(512);
    });

    it('should handle chunk overlap correctly', async () => {
      const longDocument = generateLongDocument();
      const chunks = await chunker.chunk(longDocument);

      // Check overlap
      for (let i = 1; i < chunks.length; i++) {
        const prevEnd = chunks[i - 1].text.slice(-100);
        const currentStart = chunks[i].text.slice(0, 100);
        expect(currentStart).toContain(prevEnd.split(' ').pop());
      }
    });
  });

  describe('Embedding Generation', () => {
    it('should generate embeddings with correct dimensions', async () => {
      const generator = new EmbeddingGenerator(mockAI);
      const chunks = [{ text: 'Test legal text', metadata: {} }];

      const embeddings = await generator.generateEmbeddings(chunks);

      expect(embeddings[0].values).toHaveLength(1024); // BGE-M3 dimensions
      expect(embeddings[0].values.every(v => typeof v === 'number')).toBe(true);
    });
  });
});
```

2. **Integration Testing**
```typescript
// tests/integration/api.test.ts
import { unstable_dev } from 'wrangler';
import type { UnstableDevWorker } from 'wrangler';

describe('API Integration Tests', () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev('workers/api/src/index.ts', {
      experimental: { disableExperimentalWarning: true }
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  describe('Authentication', () => {
    it('should register new user', async () => {
      const resp = await worker.fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!',
          platform: 'web'
        })
      });

      expect(resp.status).toBe(201);
      const data = await resp.json();
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
    });

    it('should reject invalid credentials', async () => {
      const resp = await worker.fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword'
        })
      });

      expect(resp.status).toBe(401);
    });
  });

  describe('Chat Endpoints', () => {
    let authToken: string;

    beforeEach(async () => {
      // Login to get token
      const resp = await worker.fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!'
        })
      });

      const data = await resp.json();
      authToken = data.token;
    });

    it('should create conversation', async () => {
      const resp = await worker.fetch('/api/v1/chat/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(resp.status).toBe(201);
      const data = await resp.json();
      expect(data).toHaveProperty('conversationId');
    });

    it('should handle streaming responses', async () => {
      const conversationId = 'test-conv-id';
      const resp = await worker.fetch(
        `/api/v1/chat/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Luật lao động quy định gì về thời gian làm việc?'
          })
        }
      );

      expect(resp.status).toBe(200);
      expect(resp.headers.get('content-type')).toBe('text/event-stream');
    });
  });
});
```

3. **E2E Testing**
```typescript
// tests/e2e/chat.test.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test('should complete full chat interaction', async ({ page }) => {
    // Navigate to website
    await page.goto('https://lawbot.vn');

    // Open chat widget
    await page.click('[data-testid="chat-button"]');

    // Wait for widget to load
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();

    // Type message
    await page.fill('[data-testid="chat-input"]', 'Thời gian làm việc tối đa là bao nhiêu?');
    await page.press('[data-testid="chat-input"]', 'Enter');

    // Wait for response
    await expect(page.locator('[data-testid="ai-message"]')).toBeVisible({ timeout: 10000 });

    // Check citations
    await expect(page.locator('[data-testid="citations"]')).toContainText('Bộ luật Lao động');

    // Test quick reply
    await page.click('[data-testid="quick-reply-0"]');

    // Verify follow-up response
    await expect(page.locator('[data-testid="ai-message"]:last-child')).toBeVisible();
  });

  test('should handle Vietnamese input correctly', async ({ page }) => {
    await page.goto('https://lawbot.vn');

    // Test Vietnamese with diacritics
    const vietnameseQueries = [
      'Quyền sở hữu tài sản được bảo vệ như thế nào?',
      'Thủ tục ly hôn đơn phương',
      'Điều kiện thành lập công ty TNHH'
    ];

    for (const query of vietnameseQueries) {
      await page.fill('[data-testid="search-input"]', query);
      await page.press('[data-testid="search-input"]', 'Enter');

      // Verify results contain Vietnamese text
      await expect(page.locator('[data-testid="search-results"]')).not.toBeEmpty();
    }
  });
});
```

4. **Performance Testing**
```typescript
// tests/performance/load.test.ts
import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 1000 },  // Stay at 1000 users
    { duration: '2m', target: 10000 }, // Spike to 10K
    { duration: '5m', target: 10000 }, // Stay at 10K
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // 95% requests under 2s
    'errors': ['rate<0.1'],               // Error rate under 10%
  },
};

export default function () {
  // Test chat API
  const chatPayload = JSON.stringify({
    message: 'Test legal question',
    conversationId: 'perf-test-conv'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${__ENV.TEST_TOKEN}'
    },
  };

  const response = http.post(
    'https://api.lawbot.vn/v1/chat/messages',
    chatPayload,
    params
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'has response body': (r) => r.body.length > 0,
  });

  errorRate.add(response.status !== 200);

  sleep(1);
}

// WebSocket test
export function testWebSocket() {
  const ws = connect('wss://api.lawbot.vn/notifications', {
    headers: { 'Authorization': 'Bearer ${__ENV.TEST_TOKEN}' }
  });

  ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'subscribe' }));
  });

  ws.on('message', (data) => {
    check(data, {
      'received notification': () => data.length > 0
    });
  });

  ws.setTimeout(() => {
    ws.close();
  }, 30000);
}
```

5. **Security Testing**
```typescript
// tests/security/auth.test.ts
describe('Security Tests', () => {
  describe('Authentication Security', () => {
    it('should prevent SQL injection', async () => {
      const maliciousInputs = [
        "' OR '1'='1",
        "admin'--",
        "'; DROP TABLE users;--"
      ];

      for (const input of maliciousInputs) {
        const resp = await fetch('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: input,
            password: input
          })
        });

        expect(resp.status).toBe(401);
        // Verify database still intact
        const check = await fetch('/api/v1/health');
        expect(check.status).toBe(200);
      }
    });

    it('should enforce rate limiting', async () => {
      const requests = Array(150).fill(null).map(() =>
        fetch('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrong'
          })
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should validate JWT properly', async () => {
      const invalidTokens = [
        'invalid.token.here',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        ''
      ];

      for (const token of invalidTokens) {
        const resp = await fetch('/api/v1/chat/conversations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        expect(resp.status).toBe(401);
      }
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize user input', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")'
      ];

      for (const payload of xssPayloads) {
        const resp = await fetch('/api/v1/chat/messages', {
          method: 'POST',
          body: JSON.stringify({ message: payload })
        });

        const data = await resp.json();
        expect(data.message).not.toContain('<script>');
        expect(data.message).not.toContain('javascript:');
      }
    });
  });
});
```

6. **Accessibility Testing**
```typescript
// tests/a11y/accessibility.test.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test('should meet WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('https://lawbot.vn');

    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('https://lawbot.vn');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('tabindex');

    // Test chat widget keyboard navigation
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('https://lawbot.vn');

    // Check main landmarks
    await expect(page.locator('nav')).toHaveAttribute('aria-label');
    await expect(page.locator('main')).toHaveAttribute('role', 'main');

    // Check form elements
    const inputs = page.locator('input');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const label = page.locator(`label[for="${id}"]`);
      await expect(label).toBeVisible();
    }
  });
});
```

7. **Test Data & Fixtures**
```typescript
// tests/fixtures/legal-documents.ts
export const legalDocuments = {
  civilCode: {
    article123: `Điều 123. Quyền sở hữu tài sản
    1. Chủ sở hữu có quyền chiếm hữu, sử dụng, định đoạt tài sản của mình theo quy định của pháp luật.
    2. Quyền sở hữu tài sản bao gồm quyền chiếm hữu, quyền sử dụng và quyền định đoạt tài sản.`,

    article456: `Điều 456. Hợp đồng mua bán
    1. Hợp đồng mua bán là sự thỏa thuận giữa các bên.
    2. Bên bán chuyển quyền sở hữu tài sản cho bên mua.`
  },

  laborCode: {
    article104: `Điều 104. Thời giờ làm việc
    1. Thời giờ làm việc bình thường không quá 08 giờ trong 01 ngày.
    2. Thời giờ làm việc không quá 48 giờ trong 01 tuần.`
  }
};

export const testUsers = [
  { email: 'user1@test.com', password: 'Test123!', platform: 'web' },
  { email: 'user2@test.com', password: 'Test456!', platform: 'zalo' },
  { email: 'user3@test.com', password: 'Test789!', platform: 'facebook' }
];

export const testQueries = [
  'Thời gian làm việc tối đa là bao nhiêu?',
  'Quy định về hợp đồng lao động xác định thời hạn?',
  'Điều kiện ly hôn đơn phương?'
];
```

## Todo List
- [ ] Setup testing framework
- [ ] Write unit tests
- [ ] Create integration tests
- [ ] Build E2E test suite
- [ ] Implement load testing
- [ ] Add security tests
- [ ] Test accessibility
- [ ] Create test fixtures
- [ ] Setup CI/CD pipeline
- [ ] Generate test reports
- [ ] Performance profiling

## Success Criteria
- 90% code coverage achieved
- All E2E tests passing
- Load test handles 10K users
- No critical vulnerabilities
- WCAG 2.1 AA compliant

## Risk Assessment
- **Risk**: Edge runtime testing challenges
- **Mitigation**: Use Miniflare, wrangler dev
- **Risk**: Vietnamese text test coverage
- **Mitigation**: Comprehensive test fixtures

## Security Considerations
- Test all auth flows
- Validate input sanitization
- Check for vulnerabilities
- Test rate limiting

## Next Steps
- Phase 14: Deployment & Launch