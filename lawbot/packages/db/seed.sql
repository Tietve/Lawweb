-- LawBot Seed Data
-- Sample data for development and testing

-- Sample legal document categories
INSERT OR IGNORE INTO legal_documents (id, law_code, article, title, category, content, effective_date) VALUES
('ld-blhs2015-d1', 'BLHS2015', 'Điều 1', 'Phạm vi điều chỉnh', 'Hình sự',
  'Bộ luật hình sự quy định những hành vi phạm tội và hình phạt; căn cứ, nguyên tắc xác định tội phạm và trách nhiệm hình sự; các chế định của luật hình sự và áp dụng các biện pháp tư pháp.',
  1451577600),

('ld-blhs2015-d2', 'BLHS2015', 'Điều 2', 'Nhiệm vụ của Bộ luật hình sự', 'Hình sự',
  'Bộ luật hình sự có nhiệm vụ bảo vệ độc lập, chủ quyền, thống nhất, toàn vẹn lãnh thổ của Tổ quốc, bảo vệ chế độ xã hội chủ nghĩa và quyền làm chủ của nhân dân; bảo vệ tính mạng, sức khỏe, danh dự, nhân phẩm, tự do, tài sản của con người, công dân; bảo vệ tài sản của Nhà nước, tổ chức; phòng ngừa tội phạm và các vi phạm pháp luật khác.',
  1451577600),

('ld-blds2024-d1', 'BLDS2024', 'Điều 1', 'Phạm vi điều chỉnh', 'Dân sự',
  'Bộ luật dân sự quy định nhân thân, tài sản, giao dịch dân sự và trách nhiệm dân sự; hôn nhân và gia đình; kinh doanh, thương mại và các quan hệ dân sự khác.',
  1704067200),

('ld-blds2024-d5', 'BLDS2024', 'Điều 5', 'Nguyên tắc tôn trọng, bảo vệ quyền con người', 'Dân sự',
  'Quyền con người, quyền công dân về nhân thân, tài sản được tôn trọng, bảo vệ theo quy định của Bộ luật này, luật khác có liên quan và điều ước quốc tế mà nước Cộng hòa xã hội chủ nghĩa Việt Nam là thành viên.',
  1704067200),

('ld-bllđ2019-d3', 'BLLĐ2019', 'Điều 3', 'Quyền làm việc', 'Lao động',
  'Người lao động có quyền làm việc, tự do lựa chọn việc làm, nghề nghiệp, nơi làm việc, học nghề, nâng cao trình độ nghề nghiệp, được đối xử bình đẳng, làm việc trong điều kiện đảm bảo an toàn, vệ sinh lao động.',
  1577836800),

('ld-bllđ2019-d4', 'BLLĐ2019', 'Điều 4', 'Nghĩa vụ của người lao động', 'Lao động',
  'Người lao động có nghĩa vụ thực hiện hợp đồng lao động, hợp đồng làm việc, tham gia bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp, chấp hành nội quy lao động, kỷ luật lao động.',
  1577836800);

-- Sample test users for development
INSERT OR IGNORE INTO users (id, phone, email, name, platform, metadata) VALUES
('usr-test-zalo-001', '+84901234567', 'test.zalo@lawbot.vn', 'Nguyễn Văn A', 'zalo', '{"test": true}'),
('usr-test-messenger-001', NULL, 'test.messenger@lawbot.vn', 'Trần Thị B', 'messenger', '{"test": true}'),
('usr-test-web-001', '+84907654321', 'test.web@lawbot.vn', 'Lê Văn C', 'web', '{"test": true}'),
('usr-test-widget-001', NULL, 'test.widget@lawbot.vn', 'Phạm Thị D', 'widget', '{"test": true}');

-- Sample conversation data
INSERT OR IGNORE INTO conversations (id, user_id, platform, status, metadata) VALUES
('conv-test-001', 'usr-test-zalo-001', 'zalo', 'active', '{"topic": "Hình sự"}'),
('conv-test-002', 'usr-test-web-001', 'web', 'active', '{"topic": "Dân sự"}'),
('conv-test-003', 'usr-test-messenger-001', 'messenger', 'archived', '{"topic": "Lao động"}');

-- Sample messages
INSERT OR IGNORE INTO messages (id, conversation_id, role, content, sources) VALUES
('msg-test-001', 'conv-test-001', 'user', 'Tội trộm cắp tài sản bị phạt như thế nào?', NULL),
('msg-test-002', 'conv-test-001', 'assistant', 'Tội trộm cắp tài sản được quy định tại Điều 173 Bộ luật Hình sự 2015. Người nào trộm cắp tài sản của người khác...',
  '[{"law_code": "BLHS2015", "article": "Điều 173", "relevance": 0.95}]'),
('msg-test-003', 'conv-test-002', 'user', 'Quyền sở hữu tài sản là gì?', NULL),
('msg-test-004', 'conv-test-002', 'assistant', 'Quyền sở hữu là quyền chiếm hữu, sử dụng, định đoạt tài sản của chủ sở hữu...',
  '[{"law_code": "BLDS2024", "article": "Điều 186", "relevance": 0.92}]');

-- Sample feedback
INSERT OR IGNORE INTO feedback (id, message_id, user_id, rating, comment) VALUES
('fb-test-001', 'msg-test-002', 'usr-test-zalo-001', 5, 'Rất hữu ích và chính xác'),
('fb-test-002', 'msg-test-004', 'usr-test-web-001', 4, 'Tốt nhưng cần thêm ví dụ cụ thể');

-- Sample analytics data (for development)
INSERT OR IGNORE INTO analytics_daily (date, total_users, new_users, active_users, total_conversations, total_messages, avg_response_time_ms, platform_breakdown) VALUES
('2024-01-01', 100, 20, 50, 150, 450, 250, '{"zalo": 60, "messenger": 20, "web": 15, "widget": 5}'),
('2024-01-02', 120, 25, 65, 180, 540, 230, '{"zalo": 70, "messenger": 25, "web": 20, "widget": 5}');

INSERT OR IGNORE INTO analytics_hourly (datetime, active_users, conversations, messages, avg_response_time_ms, errors) VALUES
('2024-01-01 10:00:00', 15, 20, 60, 220, 0),
('2024-01-01 11:00:00', 18, 25, 75, 240, 1),
('2024-01-01 14:00:00', 22, 30, 90, 260, 0);
