# WalletLens

**Paid blockchain intelligence on demand.** Query wallet data, transfers, and generate reports—all via x402 USDC payments with no accounts needed.

WalletLens is a full-stack application featuring:
- **Web UI** for direct wallet queries
- **REST API** for programmatic access
- **MCP server** for AI agents (Claude, Cursor)

---

## Quick Start

### Prerequisites

- **Node.js 18+**
- **Docker & Docker Compose** (for PostgreSQL + Redis)

### Installation

```bash
# Clone and install workspace dependencies
git clone https://github.com/walletlens/walletlens.git
cd walletlens
npm install
```

### Local Development

**Start the database stack:**
```bash
npm run docker:up
```

This launches PostgreSQL and Redis containers defined in `apps/api/docker-compose.yml`.

**Run all services:**
```bash
npm run dev:api     # Backend API on :4000
npm run dev:web     # Frontend on :3000
```

**Or run individually:**
```bash
cd apps/api && npm run dev
cd apps/web && npm run dev
```

### Create `.env` file

**Backend** (`apps/api/.env`):
```bash
# Database
DATABASE_URL="postgresql://walletlens_user:walletlens_password@localhost:5432/walletlens"
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="your-secret-key-at-least-32-characters-long"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# System
NODE_ENV="development"
PORT=4000
LOG_LEVEL="debug"

# Blockchain
NETWORK="base-sepolia"
ARKHAM_API_KEY="your-arkham-key"

# Payment
MONKEPAY_API_KEY_ID="your-key-id"
MONKEPAY_API_KEY_SECRET="your-secret"

# AI
ANTHROPIC_API_KEY="your-claude-key"

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend** (`apps/web/.env.local`):
```bash
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="your-wc-project-id"
NEXT_PUBLIC_NETWORK="base-sepolia"
```

### Database Setup

```bash
cd apps/api

# Run pending migrations
npm run db:push

# Or, in dev mode with rollback support
npm run db:migrate
```

---

## Architecture

### Monorepo Structure

```
walletlens/
├── apps/
│   ├── api/           # Express backend + Prisma ORM
│   └── web/           # Next.js 16 frontend
├── packages/
│   └── mcp/           # Model Context Protocol server (publishable)
└── package.json       # Workspace root (npm workspaces)
```

### Applications

#### API (`apps/api`)

**Stack:** Express, TypeScript, Prisma, PostgreSQL, Redis, x402-fetch

**Key Features:**
- Wallet-gated authentication (SIWE - Sign In With Ethereum)
- Three paid tools via x402:
  - `/analyze` — Wallet analysis ($0.10 USDC)
  - `/transfers` — Transfer history ($0.05 USDC)
  - `/report` — Full report generation ($1.00 USDC)
- JWT session management with refresh tokens
- Arkham integration for blockchain intelligence
- Redis caching (5 min TTL on Arkham queries)
- Rate limiting (100 req/15 min)

**Endpoints:**
- `POST /api/v1/auth/siwe` — Request SIWE message
- `POST /api/v1/auth/verify` — Verify signature
- `POST /api/v1/analyze/{address}` — Analyze wallet
- `POST /api/v1/transfers/{address}` — Get transfers
- `POST /api/v1/reports/{address}` — Generate report

**Database Models:**
- `User` — Wallet address, roles, ban status
- `UserSession` — JWT tokens + refresh tokens
- `Report` — Query results (stores agent payments + user claims)

#### Web (`apps/web`)

**Stack:** Next.js 16, React 19, Tailwind CSS, RainbowKit, Wagmi/Viem, x402-fetch

**Key Features:**
- Wallet connection (MetaMask, WalletConnect, etc.)
- Direct wallet query UI (no accounts)
- Results display for analyze/transfers/reports
- Payment handling via x402 protocol
- Responsive dark theme design

**Pages:**
- `/` — Homepage with action selector
- `/analyze/[address]` — Wallet analysis results
- `/transfers/[address]` — Transfer history
- `/report/[address]` — Full report
- `/dashboard` — User report history
- `/history/[id]` — Detailed report view

#### MCP Server (`packages/mcp`)

**Stack:** TypeScript, MCP SDK, Viem

**Status:** Published to npm as `@walletlens/mcp` (public)

**Setup (one command):**
```bash
AGENT_PRIVATE_KEY=0x... npx -y @walletlens/mcp setup
```

This auto-generates Claude Desktop configuration with the MCP server.

**Capabilities:**
- `analyze_wallet` — Powered by AI summarization
- `get_transfers` — Direct transfer listing
- `generate_report` — Full analysis

See [packages/mcp/README.md](packages/mcp/README.md) for full documentation.

---

## Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16, React 19 | SSR web interface |
| **Backend** | Express 4, Node 18+ | REST API |
| **Database** | PostgreSQL 16 | Persistent storage |
| **Cache** | Redis 7 | Query caching |
| **ORM** | Prisma | Schema + migrations |
| **Language** | TypeScript 5 | Type safety |
| **Payments** | x402 protocol | USDC per-query billing |
| **Blockchain** | Viem, Wagmi, RainbowKit | Wallet integration |
| **Intel** | Arkham API | On-chain intelligence |
| **AI** | Anthropic Claude | Analysis summarization |
| **Agent** | MCP (Model Context Protocol) | Claude/Cursor integration |

---

## Environment Variables

### Backend (`apps/api`)

| Variable | Default | Required | Notes |
|----------|---------|----------|-------|
| `NODE_ENV` | `development` | — | `development`, `production`, `test` |
| `PORT` | `4000` | — | Server port |
| `LOG_LEVEL` | `info` | — | `debug`, `info`, `warn`, `error` |
| `DATABASE_URL` | — | ✅ | PostgreSQL connection string |
| `REDIS_URL` | — | ✅ | Redis connection string |
| `JWT_SECRET` | — | ✅ | Minimum 32 characters |
| `JWT_EXPIRES_IN` | `24h` | — | JWT expiration time |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | — | Refresh token expiration |
| `CORS_ORIGIN` | `http://localhost:3000` | — | CORS allowed origin |
| `COOKIE_SECURE` | `false` | — | Set `true` in production |
| `COOKIE_SAME_SITE` | `Lax` | — | CSRF protection |
| `COOKIE_DOMAIN` | — | — | For cross-domain cookies |
| `NETWORK` | `base-sepolia` | — | `base` (mainnet) or `base-sepolia` (testnet) |
| `ARKHAM_API_KEY` | — | ✅ | Arkham Intelligence API key |
| `ARKHAM_BASE_URL` | — | — | Arkham endpoint |
| `ARKHAM_CACHE_TTL_SECONDS` | `300` | — | Query cache duration |
| `MONKEPAY_API_KEY_ID` | — | ✅ | Payment processor key ID |
| `MONKEPAY_API_KEY_SECRET` | — | ✅ | Payment processor secret |
| `ANTHROPIC_API_KEY` | — | ✅ | Claude API key |
| `RATE_LIMIT_WINDOW_MS` | `900000` | — | 15 minutes in ms |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | — | Requests per window |

### Frontend (`apps/web`)

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL (e.g., `http://localhost:4000`) |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | ✅ | WalletConnect project ID |
| `NEXT_PUBLIC_NETWORK` | — | Default network (`base-sepolia`) |

### MCP Server (`packages/mcp`)

| Variable | Default | Required | Notes |
|----------|---------|----------|-------|
| `WALLETLENS_API_URL` | `https://api.walletlens.online` | — | API endpoint for agent |
| `AGENT_PRIVATE_KEY` | — | ✅ | 0x-prefixed private key for x402 payments |
| `NETWORK` | `base-sepolia` | — | Blockchain network |
| `X402_MAX_PAYMENT_USDC` | `10` | — | Max payment cap per tool call |

---

## Workspace Scripts

### Root (`package.json`)

```bash
npm run dev:api          # Start API dev server
npm run dev:web          # Start web dev server
npm run dev:mcp          # Start MCP dev server

npm run build:api        # Build API (tsc)
npm run build:web        # Build web (next build)
npm run build:mcp        # Build MCP (tsc)

npm run start:api        # Start API production
npm run start:web        # Start web production

npm run docker:up        # Start Docker compose stack
npm run docker:down      # Stop Docker stack
```

### API (`apps/api`)

```bash
npm run dev              # Watch mode with ts-node/esm
npm run build            # Compile TypeScript
npm run start            # Run compiled dist
npm run db:push          # Push schema to DB
npm run db:migrate       # Dev migration mode
npm run db:studio        # Open Prisma Studio UI
npm run *:check          # Integration test scripts
```

### Web (`apps/web`)

```bash
npm run dev              # Start dev server on :3000
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### MCP (`packages/mcp`)

```bash
npm run build            # Compile TypeScript
npm run dev              # Run with .env file
npm run start            # Run compiled dist
```

---

## Docker Compose Stack

**File:** `apps/api/docker-compose.yml`

| Service | Image | Port | Volume |
|---------|-------|------|--------|
| **postgres** | `postgres:16-alpine` | 5432 | `postgres_data` |
| **redis** | `redis:7-alpine` | 6379 | `redis_data` |

**Postgres Defaults:**
- User: `walletlens_user`
- Password: `walletlens_password`
- Database: `walletlens`

**Health checks:** Both services have health checks enabled and depend on each other.

**To stop:**
```bash
npm run docker:down
```

---

## Deployment

### Backend (API)

**Recommended Platform:** Railway

**Docker Build:**
- Multi-stage build (builder + runtime)
- Base: `node:20-alpine`
- Runs `prisma migrate deploy` on startup
- Exposes port **4000**

**Deploy:**
1. Push to GitHub
2. Connect Railway project to repo
3. Set environment variables (see `.env` above)
4. Railway auto-deploys on push

### Frontend (Web)

**Recommended Platform:** Vercel

**Deploy:**
1. Push to GitHub
2. Connect Vercel to repo
3. Set environment variables
4. Vercel auto-deploys on push

### MCP Server

**Distribution:** npm package `@walletlens/mcp`

**Deployed via npx:**
```bash
AGENT_PRIVATE_KEY=0x... npx -y @walletlens/mcp setup
```

---

## Database Migrations

**Create new migration:**
```bash
cd apps/api
npx prisma migrate dev --name my_migration_name
```

This creates a `.sql` file in `prisma/migrations/` and applies it locally.

**Deploy migrations to production:**
```bash
npx prisma migrate deploy
```

The Docker image runs this automatically on startup.

---

## Testing

### API
```bash
cd apps/api
npm run auth:check       # Test SIWE flow
npm run arkham:check     # Test Arkham integration
npm run summarize:check  # Test Claude summarization
npm run x402:check       # Test x402 payments
```

### Web
```bash
cd apps/web
npm run lint             # ESLint check
```

---

## Troubleshooting

### Database connection failed

**Issue:** `ECONNREFUSED` or timeout on PostgreSQL

**Solution:**
```bash
# Check Docker status
docker ps

# Restart stack
npm run docker:down
npm run docker:up

# Verify connection
psql -h localhost -U walletlens_user -d walletlens
# Password: walletlens_password
```

### Redis connection failed

**Issue:** Redis client errors

**Solution:**
```bash
# Check Redis
redis-cli ping
# Expected: PONG

# Or restart
npm run docker:down && npm run docker:up
```

### API not running

**Issue:** Port 4000 already in use

**Solution:**
```bash
# Find process on 4000
lsof -i :4000

# Kill it
kill -9 <PID>

# Or change port
PORT=5000 npm run start:api
```

### Frontend can't reach API

**Issue:** CORS error or connection refused

**Solution:**
- Verify `NEXT_PUBLIC_API_URL` matches running API
- Check API is running: `curl http://localhost:4000/health`
- Ensure both are on same network (localhost for dev)

### Prisma schema conflicts

**Issue:** Migration lock or schema out of sync

**Solution:**
```bash
cd apps/api

# Unlock if stuck
npx prisma migrate resolve --rolled-back <migration_name>

# Restart from clean
npm run db:push  # Force push schema
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am "feat: add new feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

**Code style:**
- TypeScript strict mode enabled
- ESLint configured for both API and Web
- Prettier formatting (via ESLint)

---

## License

MIT — See LICENSE file for details

---

## Links

- **Live:** https://walletlens.online
- **API Docs:** https://api.walletlens.online
- **MCP Package:** https://npmjs.com/package/@walletlens/mcp
- **GitHub:** https://github.com/walletlens/walletlens
