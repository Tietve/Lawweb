# QUICK REFERENCE - AI Agent Văn Phòng Luật

Bản tóm tắt nhanh cho developers. Xem [`ai-agent-architecture.md`](./ai-agent-architecture.md) để biết chi tiết đầy đủ.

---

## 🎯 TECH STACK CHÍNH

```yaml
Backend:    Python 3.11 + FastAPI
Database:   PostgreSQL 15 + pgvector
LLM:        Claude Sonnet 3.5 (primary), Haiku 3.5 (routing)
Embedding:  Cohere embed-multilingual-v3
RAG:        LangChain
Frontend:   React 18 + TypeScript
Deploy:     Docker Compose
Monitoring: Prometheus + Grafana + ELK
```

---

## 📁 CẤU TRÚC PROJECT

```
lawfirm-ai-agent/
├── app/
│   ├── ai/                    # AI components
│   │   ├── intent_classifier.py
│   │   ├── agent_router.py
│   │   └── upl_guardrail.py
│   ├── rag/                   # RAG system
│   │   ├── legal_rag.py
│   │   ├── ops_rag.py
│   │   └── citation_validator.py
│   ├── security/              # Security
│   │   ├── llm_firewall.py
│   │   └── pii_protection.py
│   ├── api/                   # FastAPI routes
│   │   └── main.py
│   └── core/                  # Core utilities
│       └── degradation.py
│
├── kb_ingestion/              # Knowledge base pipeline
│   ├── legal_doc_pipeline.py
│   ├── ingest.py
│   └── UPDATE_GUIDE.md
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── scenario/
│   └── security/
│
├── load_tests/
│   ├── locustfile.py
│   └── run_tests.sh
│
├── devops/
│   ├── backup_restore.sh
│   ├── disaster_recovery.yaml
│   └── RUNBOOK.md
│
└── docker-compose.yml
```

---

## ⚡ COMMANDS QUAN TRỌNG

### Development

```bash
# Setup environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Run development server
uvicorn app.api.main:app --reload --port 8000

# Run tests
pytest tests/ -v
pytest tests/ --cov=app --cov-report=html
```

### Knowledge Base Management

```bash
# Ingest legal document
python kb_ingestion/ingest.py \
  --pdf data/legal/LUAT-2014-22.pdf \
  --metadata data/legal/LUAT-2014-22.yaml

# Ingest service
python kb_ingestion/ingest_service.py \
  --yaml data/ops/services/divorce_consultation.yaml

# Verify indexing
psql lawfirm_db -c "SELECT COUNT(*) FROM legal_chunks"
psql lawfirm_db -c "SELECT COUNT(*) FROM ops_chunks"
```

### Load Testing

```bash
# Run baseline test (10 users, 10 min)
locust -f load_tests/locustfile.py \
  --host http://localhost:8000 \
  --users 10 --spawn-rate 2 --run-time 10m \
  --headless --html reports/baseline.html

# Run stress test (200 users)
locust -f load_tests/locustfile.py \
  --users 200 --spawn-rate 20 --run-time 15m \
  --headless
```

### Backup & Restore

```bash
# Backup database
./devops/backup_restore.sh backup

# Restore from backup
./devops/backup_restore.sh restore /backups/lawfirm_db_20250115.sql.gz

# List backups
ls -lh /backups/lawfirm_db_*.sql.gz
```

### Docker Operations

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api
docker-compose logs -f postgres

# Restart services
docker-compose restart api

# Stop all
docker-compose down

# Clean up
docker system prune -a --volumes
```

---

## 🔑 KEY METRICS & THRESHOLDS

### Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **P95 Response Time** | < 2s | > 3s |
| **P99 Response Time** | < 5s | > 7s |
| **Error Rate** | < 0.1% | > 0.5% |
| **Uptime** | > 99.5% | < 99% |
| **Cost/Conversation** | < $0.10 | > $0.20 |

### Database Health

```sql
-- Check connection pool
SELECT count(*) FROM pg_stat_activity WHERE datname = 'lawfirm_db';

-- Check slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

---

## 🚨 TROUBLESHOOTING QUICK GUIDE

### API Not Responding

```bash
# Check if container is running
docker ps | grep lawfirm

# Check logs
docker-compose logs --tail=100 api

# Restart
docker-compose restart api

# If still down, check health
curl http://localhost:8000/api/health
```

### Database Issues

```bash
# Check if Postgres is up
pg_isready -h localhost -p 5432

# Check connections
psql lawfirm_db -c "SELECT count(*) FROM pg_stat_activity"

# Restart Postgres
docker-compose restart postgres

# Restore from backup if corrupted
./devops/backup_restore.sh restore /backups/latest.sql.gz
```

### High Latency

```bash
# Check Claude API status
curl https://status.anthropic.com/api/v2/status.json

# Check database query performance
psql lawfirm_db -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 5"

# Check Redis
redis-cli ping
redis-cli info memory

# Switch to degraded mode manually
# Edit app/config.py: EMERGENCY_MODE = True
docker-compose restart api
```

### Out of Disk Space

```bash
# Check usage
df -h

# Clean Docker
docker system prune -a --volumes -f

# Clean logs
journalctl --vacuum-time=1d
find /var/log -name "*.log" -mtime +7 -delete

# Archive old backups
tar -czf backups_archive.tar.gz /backups/*.sql.gz
aws s3 cp backups_archive.tar.gz s3://lawfirm-archives/
rm /backups/*.sql.gz
```

### High API Costs

```python
# Enable cost controls in app/config.py
EMERGENCY_MODE = True
MAX_DAILY_API_COST = 100  # USD
PRIMARY_MODEL = "claude-haiku-3.5"  # Switch to cheaper model
DISABLE_RERANKING = True
CACHE_TTL = 3600  # Aggressive caching
```

---

## 📊 MONITORING DASHBOARDS

### Grafana Dashboards

- **System Overview**: http://localhost:3000/d/system-overview
- **API Performance**: http://localhost:3000/d/api-performance
- **Database Metrics**: http://localhost:3000/d/database-metrics
- **Cost Tracking**: http://localhost:3000/d/cost-tracking

### Key Queries

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Database connections
pg_stat_activity_count
```

---

## 🔐 SECURITY CHECKLIST

### Pre-Deployment

- [ ] API keys rotated and secured
- [ ] Environment variables not hardcoded
- [ ] HTTPS/TLS enabled (Nginx)
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] PII encryption enabled
- [ ] Security headers configured
- [ ] CORS properly set

### Ongoing

- [ ] Weekly security scans (`bandit`, `safety`)
- [ ] Monthly dependency updates
- [ ] Review security event logs
- [ ] Test UPL detection accuracy
- [ ] Verify no pricing leaks
- [ ] Check for prompt injection attempts

---

## 📞 EMERGENCY CONTACTS

```yaml
System Admin:     [NAME] - [PHONE]
Database Admin:   [NAME] - [PHONE]
DevOps Lead:      [NAME] - [PHONE]

External Support:
  Anthropic:      support@anthropic.com
  Cohere:         support@cohere.com
  AWS:            [ACCOUNT_NUMBER]
```

---

## 🎯 DEVELOPMENT WORKFLOW

### Adding New Feature

1. **Branch**: `git checkout -b feature/feature-name`
2. **Develop**: Write code + tests
3. **Test**: `pytest tests/`
4. **Lint**: `black . && flake8 . && mypy .`
5. **Commit**: `git commit -m "feat: description"`
6. **PR**: Create pull request
7. **Review**: Get approval
8. **Merge**: Squash and merge
9. **Deploy**: CI/CD auto-deploys to staging

### Testing New Legal Document

1. Download PDF from official source
2. Rename: `LUAT-YYYY-NN.pdf`
3. Create metadata YAML
4. Run ingestion pipeline
5. Verify chunks in database
6. Test with 5 sample queries
7. Document in KB changelog

### Updating Service Information

1. Edit YAML in `data/ops/services/`
2. Validate SALI codes
3. Run: `python kb_ingestion/ingest_service.py --yaml ...`
4. Test matching with queries
5. Update sitemap if needed

---

## 🔗 USEFUL LINKS

- **Full Architecture**: [ai-agent-architecture.md](./ai-agent-architecture.md)
- **API Docs**: http://localhost:8000/api/docs
- **Grafana**: http://localhost:3000
- **Kibana**: http://localhost:5601
- **Anthropic Docs**: https://docs.anthropic.com
- **LangChain Docs**: https://python.langchain.com
- **SALI Taxonomy**: https://www.sali.org/lmss

---

## 📝 QUICK WINS

### Reduce Costs

1. Enable prompt caching (Claude)
2. Use Haiku for simple queries
3. Reduce `top_k` in RAG from 10 → 5
4. Cache popular queries (Redis, 1h TTL)
5. Batch embed calls

### Improve Performance

1. Add indexes on frequently queried columns
2. Enable query result caching
3. Use connection pooling (already enabled)
4. Optimize slow queries (check pg_stat_statements)
5. Warm up cache after deployment

### Improve Accuracy

1. Add more test cases for UPL detection
2. Fine-tune intent classification prompt
3. Validate citations after each RAG response
4. A/B test different prompts
5. Collect user feedback (thumbs up/down)

---

**Last Updated:** 2025-01-15
**Maintainer:** AI Architecture Team

For detailed information, always refer to the [full architecture document](./ai-agent-architecture.md).
