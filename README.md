# FollowUp Trading - Frontend

Trading journal and analytics platform frontend built with React 18, TypeScript, and Vite.

## Tech Stack

- **React 18** + TypeScript
- **Vite** — build tool
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — component library (Radix UI primitives)
- **TanStack Query v5** — server state management
- **Recharts** — charting
- **Zod** — schema validation
- **React Hook Form** — form management
- **React Router** — client-side routing
- **i18next** — internationalization

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (default: http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Project Structure

```
src/
  components/         # Reusable UI components
    skeletons/        # Loading skeleton components
    ui/               # shadcn/ui primitives (Button, Card, Dialog, etc.)
    dashboard/        # Dashboard-specific components
    trades/           # Trade management components
    settings/         # Settings page components
  pages/              # Route-level page components
    auth/             # Login, Register, ForgotPassword
    Dashboard.tsx     # Main dashboard with metrics + charts
    Trades.tsx        # Trade list/table with search and filters
    Accounts.tsx      # Broker account connections
    Statistics.tsx    # Performance statistics
    RiskMetrics.tsx   # Risk analytics (VaR, Sharpe, etc.)
    Performance.tsx   # Performance charts
    Settings.tsx      # User settings + broker connections
    ...
  hooks/              # Custom React hooks
    useTrades.ts      # Trade CRUD via TanStack Query
    useAdvancedMetrics.ts  # Risk/trade metrics
    useBrokers.ts     # Broker catalog + connections
    useAnalytics.ts   # Analytics dashboard data
    useCreateTrade.ts # New trade creation
  services/           # API client layer
    apiClient.ts      # Axios instance with interceptors
    trade.service.ts  # /api/v1/trades
    metrics.service.ts # /api/v1/metrics
    broker.service.ts # /api/v1/brokers, /api/v1/broker-connections
    auth.service.ts   # /api/v1/auth
    user.service.ts   # /api/v1/users
  contexts/           # React contexts (auth, theme)
  types/              # TypeScript type definitions
  config.ts           # API base URL and app config
  i18n/               # Translation files
```

## Backend API

The frontend connects to the FollowUp Trading backend (Spring Boot) at `http://localhost:9870/api/v1/`.

Configure the API URL in `src/config.ts`.

Key endpoints consumed:
- `/trades` — Trade CRUD, search, import/export
- `/metrics/advanced/risk` — Sharpe, Sortino, VaR, drawdown
- `/brokers` — Broker catalog (8 brokers)
- `/broker-connections` — Connect, sync, test broker accounts
- `/auth` — JWT login, register, MFA, OAuth2

## Development Notes

- All API calls use `apiClient.ts` (Axios) with JWT token injection and error interceptors
- TanStack Query handles caching, refetching, and loading states
- Skeleton components in `components/skeletons/` provide structural loading placeholders
- Error boundaries and toast notifications handle API errors globally
- The app uses shadcn/ui components — add new ones with `npx shadcn@latest add <component>`
