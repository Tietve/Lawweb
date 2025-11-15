# Phase 08: Web 2 - Admin Dashboard (Cloudflare Pages)

## Context Links
- [Parent Plan](plan.md)
- [Prev: Chatbot Widget](phase-07-chatbot-widget.md)
- [Next: Realtime DO](phase-09-realtime-durable-objects.md)

## Overview
- **Date**: 2025-11-15
- **Description**: Admin dashboard for system management and analytics
- **Priority**: P1 - System management interface
- **Implementation Status**: ✅ Completed (2025-11-15)
- **Review Status**: ⏳ Pending Review

## Key Insights
- Real-time analytics essential
- Role-based access control
- Multi-tenant architecture
- Dashboard performance critical

## Requirements

### Functional
- User management
- Conversation monitoring
- Analytics dashboard
- Content management
- System configuration
- Real-time notifications

### Non-functional
- Role-based permissions
- Real-time updates
- Export capabilities
- Audit logging
- Mobile responsive

## Architecture

```
apps/web-admin/
├── src/
│   ├── pages/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── conversations/
│   │   ├── content/
│   │   └── settings/
│   ├── components/
│   │   ├── charts/
│   │   ├── tables/
│   │   └── realtime/
│   └── lib/
│       ├── auth/
│       └── api/
└── middleware/
```

## Related Code Files

### Create
- `/apps/web-admin/src/pages/dashboard/index.tsx` - Main dashboard
- `/apps/web-admin/src/pages/users/index.tsx` - User management
- `/apps/web-admin/src/components/charts/Analytics.tsx` - Analytics charts
- `/apps/web-admin/src/components/realtime/Monitor.tsx` - Real-time monitor
- `/apps/web-admin/src/middleware/auth.ts` - Auth middleware

## Implementation Steps

1. **Setup Admin Dashboard**
```typescript
// apps/web-admin/src/pages/dashboard/index.tsx
export default function Dashboard() {
  const { stats, loading } = useAnalytics();
  const { notifications } = useRealtime();

  return (
    <DashboardLayout>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Tổng Người Dùng"
          value={stats?.totalUsers || 0}
          change={stats?.userGrowth}
          icon={<UsersIcon />}
        />
        <StatCard
          title="Cuộc Trò Chuyện Hôm Nay"
          value={stats?.todayConversations || 0}
          change={stats?.conversationGrowth}
          icon={<ChatIcon />}
        />
        <StatCard
          title="Tin Nhắn/Giờ"
          value={stats?.messagesPerHour || 0}
          icon={<MessageIcon />}
        />
        <StatCard
          title="Thời Gian Phản Hồi"
          value={`${stats?.avgResponseTime || 0}ms`}
          icon={<ClockIcon />}
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <ConversationChart data={stats?.conversationHistory} />
        <PlatformBreakdown data={stats?.platformStats} />
      </div>

      {/* Real-time Activity */}
      <RealtimeActivity notifications={notifications} />
    </DashboardLayout>
  );
}
```

2. **User Management**
```typescript
// apps/web-admin/src/pages/users/index.tsx
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <DashboardLayout>
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b flex justify-between">
          <h1 className="text-2xl font-bold">Quản Lý Người Dùng</h1>
          <div className="flex gap-2">
            <ExportButton data={users} />
            <FilterButton onFilter={setFilters} />
          </div>
        </div>

        {/* Users Table */}
        <DataTable
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Tên' },
            { key: 'email', label: 'Email' },
            { key: 'platform', label: 'Nền Tảng' },
            { key: 'created_at', label: 'Ngày Tạo' },
            { key: 'last_active', label: 'Hoạt Động' },
            { key: 'status', label: 'Trạng Thái' }
          ]}
          data={users}
          onRowClick={setSelectedUser}
        />

        {/* User Detail Modal */}
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
```

3. **Conversation Monitoring**
```typescript
// apps/web-admin/src/pages/conversations/monitor.tsx
export default function ConversationMonitor() {
  const { conversations, activeCount } = useConversations();

  return (
    <DashboardLayout>
      <div className="grid md:grid-cols-3 gap-4">
        {/* Active Conversations List */}
        <div className="md:col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="font-bold mb-4">
            Đang Hoạt Động ({activeCount})
          </h2>
          <div className="space-y-2 max-h-screen overflow-y-auto">
            {conversations.map(conv => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                onClick={() => setSelected(conv)}
              />
            ))}
          </div>
        </div>

        {/* Conversation Detail */}
        <div className="md:col-span-2 bg-white rounded-lg shadow">
          {selected ? (
            <ConversationDetail
              conversation={selected}
              onIntervene={handleIntervene}
            />
          ) : (
            <EmptyState message="Chọn cuộc trò chuyện để xem chi tiết" />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
```

4. **Real-time Analytics Component**
```typescript
// apps/web-admin/src/components/charts/Analytics.tsx
export function AnalyticsChart() {
  const chartRef = useRef(null);
  const { data, subscribe } = useRealtimeData('/api/analytics/stream');

  useEffect(() => {
    const chart = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Messages/min',
          data: [],
          borderColor: 'rgb(59, 130, 246)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { display: true },
          y: { beginAtZero: true }
        }
      }
    });

    // Subscribe to real-time updates
    const unsubscribe = subscribe((newData) => {
      chart.data.labels.push(newData.time);
      chart.data.datasets[0].data.push(newData.value);

      // Keep last 20 points
      if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
      }

      chart.update('none');
    });

    return () => unsubscribe();
  }, []);

  return <canvas ref={chartRef} />;
}
```

5. **Content Management**
```typescript
// apps/web-admin/src/pages/content/legal-docs.tsx
export default function LegalDocuments() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    setUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('category', selectedCategory);

      await fetch('/api/v1/admin/documents', {
        method: 'POST',
        body: formData
      });
    }

    setUploading(false);
    refreshDocuments();
  };

  return (
    <DashboardLayout>
      <div className="bg-white rounded-lg shadow">
        {/* Upload Section */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold mb-4">Tải Lên Văn Bản Pháp Luật</h2>
          <FileUpload
            accept=".pdf,.docx,.txt"
            multiple
            onUpload={handleUpload}
            uploading={uploading}
          />
        </div>

        {/* Documents List */}
        <div className="p-6">
          <h3 className="font-bold mb-4">Văn Bản Đã Tải ({documents.length})</h3>
          <div className="space-y-2">
            {documents.map(doc => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onEdit={() => editDocument(doc)}
                onDelete={() => deleteDocument(doc.id)}
                onReindex={() => reindexDocument(doc.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

6. **Real-time Notifications**
```typescript
// apps/web-admin/src/components/realtime/NotificationCenter.tsx
export function NotificationCenter() {
  const { notifications, markAsRead } = useNotifications();

  return (
    <div className="relative">
      <button className="relative p-2">
        <BellIcon className="w-6 h-6" />
        {notifications.unread > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notifications.unread}
          </span>
        )}
      </button>

      <DropdownMenu>
        <div className="w-80 max-h-96 overflow-y-auto">
          {notifications.items.map(notif => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onRead={() => markAsRead(notif.id)}
            />
          ))}
        </div>
      </DropdownMenu>
    </div>
  );
}
```

7. **System Settings**
```typescript
// apps/web-admin/src/pages/settings/system.tsx
export default function SystemSettings() {
  const [config, setConfig] = useState({});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* AI Configuration */}
        <SettingSection title="Cấu Hình AI">
          <Select
            label="Model Chính"
            value={config.primaryModel}
            options={['claude-3.5', 'gpt-4', 'workers-ai']}
            onChange={(v) => updateConfig('primaryModel', v)}
          />
          <NumberInput
            label="Temperature"
            value={config.temperature}
            min={0}
            max={1}
            step={0.1}
            onChange={(v) => updateConfig('temperature', v)}
          />
        </SettingSection>

        {/* Rate Limiting */}
        <SettingSection title="Giới Hạn Tốc Độ">
          <NumberInput
            label="Requests/phút"
            value={config.rateLimit}
            onChange={(v) => updateConfig('rateLimit', v)}
          />
        </SettingSection>

        {/* Save Button */}
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          Lưu Cấu Hình
        </button>
      </div>
    </DashboardLayout>
  );
}
```

## Todo List
- [ ] Setup admin project
- [ ] Create dashboard layout
- [ ] Build analytics dashboard
- [ ] Implement user management
- [ ] Add conversation monitoring
- [ ] Create content management
- [ ] Setup real-time updates
- [ ] Add notification system
- [ ] Implement settings page
- [ ] Add export features
- [ ] Setup role-based access

## Success Criteria
- Real-time updates working
- Analytics accurate
- Export functions properly
- Mobile responsive
- Role permissions enforced

## Risk Assessment
- **Risk**: Real-time performance
- **Mitigation**: Use WebSockets, optimize queries
- **Risk**: Data overload
- **Mitigation**: Pagination, lazy loading

## Security Considerations
- Admin authentication required
- Role-based permissions
- Audit logging all actions
- Secure API endpoints

## Next Steps
- Phase 09: Realtime Durable Objects
- Phase 10: Zalo Integration