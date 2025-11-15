# .claude/ - Claude Code Project Memory

Thư mục này chứa **trí nhớ dài hạn** cho Claude Code về dự án **AI Agent cho Văn Phòng Luật**.

---

## 📁 CẤU TRÚC

```
.claude/
├── README.md                           # File này - hướng dẫn sử dụng
└── docs/
    ├── ai-agent-architecture.md        # Kiến trúc đầy đủ (~15,000 dòng)
    └── quick-reference.md              # Tóm tắt nhanh (~500 dòng)
```

---

## 📄 TÀI LIỆU CHI TIẾT

### 1. [`ai-agent-architecture.md`](./docs/ai-agent-architecture.md)

**Mục đích:** Tài liệu kiến trúc hoàn chỉnh, đầy đủ nhất

**Nội dung:**
- **Phần I: Kiến Trúc Cơ Bản**
  - (A) Tech Stack & Lý Do Chọn
  - (B) AI Brain Architecture (Router Agent)
  - (C) Dual Knowledge Bases (Legal + Ops)
  - (D) Model Strategy & Cost Optimization
  - (E) RAG Null Handling
  - (F) NER + Lead JSON Schema
  - (G) API & Backend Architecture
  - (H) Security & UPL Compliance
  - (I) Roadmap 12 Tuần

- **Phần II: Hệ Thống Bổ Sung**
  - Data Contract & KB Update Pipeline
  - Prompt Injection Defense Layer
  - Legal Citation Validator
  - Load/Stress Testing Plan
  - Disaster Recovery Plan
  - QA Test Cases (Unit, Integration, E2E, Security)

**Khi nào đọc:**
- Khi cần hiểu sâu về một component
- Khi triển khai tính năng mới
- Khi debug vấn đề phức tạp
- Khi onboarding thành viên mới

---

### 2. [`quick-reference.md`](./docs/quick-reference.md)

**Mục đích:** Tham khảo nhanh cho công việc hàng ngày

**Nội dung:**
- Tech stack chính
- Cấu trúc project
- Commands quan trọng (development, testing, deployment)
- Troubleshooting nhanh
- Key metrics & thresholds
- Emergency contacts

**Khi nào đọc:**
- Khi cần chạy một command cụ thể
- Khi troubleshoot vấn đề thường gặp
- Khi check metrics/thresholds
- Khi cần quick wins

---

## 🎯 CÁCH SỬ DỤNG

### Cho Developers

```bash
# Muốn hiểu toàn bộ hệ thống
cat .claude/docs/ai-agent-architecture.md | less

# Muốn tìm command cụ thể
grep -i "backup" .claude/docs/quick-reference.md

# Muốn hiểu một component (ví dụ: RAG)
grep -A 50 "## RAG" .claude/docs/ai-agent-architecture.md
```

### Cho Claude Code

Claude Code tự động đọc các file trong `.claude/docs/` để:
- Hiểu context của project
- Trả lời câu hỏi về architecture
- Gợi ý best practices
- Debug với full context

Ví dụ hỏi Claude:
- "Làm sao để thêm một văn bản luật mới vào KB?"
- "Pipeline UPL detection hoạt động như thế nào?"
- "Chi phí API hiện tại là bao nhiêu?"

Claude sẽ tham khảo docs này để trả lời chính xác.

---

## 🔄 CẬP NHẬT TÀI LIỆU

### Khi Nào Cần Update?

- ✅ Tech stack thay đổi (VD: đổi từ Claude → GPT)
- ✅ Architecture thay đổi (VD: thêm microservice mới)
- ✅ Quy trình mới (VD: CI/CD pipeline mới)
- ✅ Lessons learned từ production
- ✅ New best practices
- ❌ Bug fixes nhỏ (không cần update docs)
- ❌ Code refactoring (không ảnh hưởng architecture)

### Cách Update

1. **Edit file trực tiếp:**
   ```bash
   vim .claude/docs/ai-agent-architecture.md
   # hoặc
   code .claude/docs/ai-agent-architecture.md
   ```

2. **Commit changes:**
   ```bash
   git add .claude/docs/
   git commit -m "docs: update architecture - [mô tả thay đổi]"
   git push
   ```

3. **Update version & date:**
   ```markdown
   **Version:** 1.1  <!-- Increment version -->
   **Last Updated:** 2025-02-15
   ```

---

## 📌 NGUYÊN TẮC

### DO ✅

- ✅ Giữ docs sync với code thực tế
- ✅ Ghi lại WHY của các quyết định (không chỉ WHAT)
- ✅ Include code examples thực tế
- ✅ Update khi có breaking changes
- ✅ Version control trong Git
- ✅ Review docs trong PR (nếu ảnh hưởng architecture)

### DON'T ❌

- ❌ Copy-paste code vào docs (dễ outdate)
- ❌ Ghi chi tiết implementation quá sâu
- ❌ Duplicate info giữa các docs
- ❌ Viết docs không ai đọc
- ❌ Để docs outdate > 3 tháng

---

## 🔍 TÌM KIẾM NHANH

### Tìm Concept

```bash
# Tìm UPL detection
grep -r "UPL" .claude/docs/

# Tìm pricing flow
grep -r "pricing" .claude/docs/

# Tìm cost optimization
grep -r "cost" .claude/docs/
```

### Tìm Command

```bash
# Tìm backup command
grep -r "backup" .claude/docs/quick-reference.md

# Tìm testing command
grep -r "pytest" .claude/docs/quick-reference.md
```

### Tìm Code Example

```bash
# Tìm Python code examples
grep -A 20 "```python" .claude/docs/ai-agent-architecture.md

# Tìm SQL queries
grep -A 10 "```sql" .claude/docs/
```

---

## 📊 DOCUMENT STATS

```bash
# Đếm số dòng
wc -l .claude/docs/*.md

# Đếm số code blocks
grep -c "```" .claude/docs/*.md

# Xem kích thước
du -sh .claude/docs/
```

---

## 🚀 QUICK START

**Lần đầu clone project?**

1. Đọc file này (`.claude/README.md`) trước
2. Đọc [`quick-reference.md`](./docs/quick-reference.md) để biết commands
3. Skim [`ai-agent-architecture.md`](./docs/ai-agent-architecture.md) để hiểu big picture
4. Deep dive vào sections cụ thể khi cần

**Đang code một feature mới?**

1. Tìm section liên quan trong architecture doc
2. Đọc design decisions & rationale
3. Follow code examples & best practices
4. Update docs nếu có breaking changes

**Gặp bug production?**

1. Check [`quick-reference.md`](./docs/quick-reference.md) → Troubleshooting section
2. Nếu không có, check architecture doc → relevant component
3. Check logs, metrics theo hướng dẫn
4. Document solution vào docs sau khi fix

---

## 🤝 CONTRIBUTION

Mọi thành viên team đều có thể (và nên) contribute vào docs:

1. **Tìm thấy info sai/outdate?** → Sửa và commit
2. **Học được lesson mới?** → Thêm vào docs
3. **Phát hiện missing info?** → Bổ sung
4. **Có best practice mới?** → Document lại

**Review process:**
- Small changes (typos, formatting): Direct commit
- Medium changes (add section): Create PR, 1 approval
- Large changes (architecture redesign): Create PR, 2+ approvals + discussion

---

## 📞 SUPPORT

Nếu có câu hỏi về docs:

1. **Search docs trước** (99% câu hỏi đã có trong docs)
2. **Hỏi Claude Code** (nó đọc docs rất tốt)
3. **Hỏi team lead** (nếu docs không rõ)
4. **Update docs** sau khi được trả lời (để người sau không phải hỏi lại)

---

## 🎓 BEST PRACTICES

### Viết Docs Tốt

- **Be specific:** "Use Claude Sonnet 3.5" > "Use good LLM"
- **Include WHY:** "We chose X because Y and Z" > "We use X"
- **Add examples:** Code snippets > Abstract descriptions
- **Think future you:** Viết như thể 6 tháng sau bạn quên hết
- **Keep updated:** Docs cũ = Docs sai = Worse than no docs

### Đọc Docs Hiệu Quả

- **Skim first, deep dive later:** Đọc headings trước
- **Use search:** Ctrl+F là bạn
- **Read code examples:** Hiểu nhanh hơn text
- **Question everything:** Nếu docs không rõ, hỏi và update

---

## 📝 VERSION HISTORY

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-01-15 | Initial architecture design | AI Architecture Team |
| - | - | Future updates here | - |

---

## 🎯 ROADMAP

**Planned additions:**
- [ ] API migration guide (khi migrate lên v2)
- [ ] Performance optimization case studies
- [ ] Post-mortem templates
- [ ] Team runbooks
- [ ] Video walkthroughs

---

**Remember:** Good documentation is living documentation. Keep it updated, keep it useful, keep it real.

**Questions?** Ask Claude Code - it knows these docs by heart! 🤖
