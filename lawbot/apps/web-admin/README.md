# LawBot Admin Dashboard

Admin dashboard for managing the LawBot system.

## Features

- **Dashboard**: Real-time analytics and system overview
- **User Management**: View and manage users across platforms
- **Conversation Monitoring**: Real-time conversation monitoring with intervention
- **Content Management**: Upload and manage legal documents
- **Analytics**: Real-time analytics with Chart.js
- **Settings**: System configuration
- **Authentication**: JWT-based admin authentication

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js
- **Icons**: Lucide React
- **Deployment**: Cloudflare Pages

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Build for Cloudflare Pages
npm run pages:build

# Type check
npm run type-check
```

## Pages

- `/` - Redirect to dashboard
- `/login` - Admin login
- `/dashboard` - Main dashboard with stats and charts
- `/users` - User management with export
- `/conversations` - Real-time conversation monitoring
- `/content` - Document upload and management
- `/analytics` - Real-time analytics
- `/settings` - System configuration

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

## Authentication

The middleware protects all routes except `/login`. Admin token is stored in cookies.

Demo credentials:
- Email: admin@lawbot.vn
- Password: admin123

## File Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # Reusable components
│   ├── layout/      # Layout components
│   ├── ui/          # UI components
│   ├── charts/      # Chart components
│   └── realtime/    # Real-time components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and API client
└── types/           # TypeScript types
```

## Deployment

Deploy to Cloudflare Pages:

```bash
npm run pages:build
```

Then upload the `.vercel/output/static` directory to Cloudflare Pages.
