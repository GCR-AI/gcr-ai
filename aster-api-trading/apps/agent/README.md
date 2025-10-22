# GCR AI

AI-powered autonomous trading agent for Aster Finance using Claude AI.

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment

```bash
cp ../../.env.example .env
```

Edit `.env` and fill in:
- `ANTHROPIC_API_KEY` - Your Claude API key
- `ASTER_USER_ADDRESS` - Your main wallet address
- `ASTER_SIGNER_ADDRESS` - API wallet from https://www.asterdex.com/en/api-wallet
- `ASTER_PRIVATE_KEY` - API wallet private key
- `DATABASE_URL` -  Connection string

### 3. Set Up Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run in Development

```bash
pnpm dev
```

This starts:
- API server on http://localhost:3001
- Trading agent (if `TRADING_ENABLED=true`)

## Architecture

```
apps/agent/
├── src/
│   ├── aster/         # Aster API client
│   │   ├── client.ts  # Main API wrapper
│   │   ├── signer.ts  # Web3 signature auth
│   │   └── types.ts   # TypeScript types
│   ├── agent/         # Trading logic
│   │   ├── core.ts    # Main agent loop
│   │   ├── brain.ts   # Claude AI integration
│   │   └── risk.ts    # Risk management
│   ├── api/           # REST API
│   │   └── server.ts  # Express server
│   ├── db/            # Database
│   │   └── client.ts  # Prisma client
│   ├── utils/         # Utilities
│   │   ├── logger.ts  # Winston logging
│   │   └── config.ts  # Environment config
│   └── index.ts       # Entry point
└── prisma/
    └── schema.prisma  # Database schema
```

## API Endpoints

### Health & Status
- `GET /api/health` - Agent health check
- `GET /api/stats` - Trading statistics

### Data
- `GET /api/decisions` - Recent AI decisions
- `GET /api/decisions/latest` - Latest decision
- `GET /api/positions` - Open positions
- `GET /api/trades` - Trade history
- `GET /api/pnl` - P&L history

### Control
- `POST /api/agent/control` - Pause/resume agent
  ```json
  { "action": "pause" | "resume" }
  ```

## Configuration

Key environment variables:

```env
# Trading
TRADING_ENABLED=false          # Enable live trading
DRY_RUN_MODE=true             # Paper trading mode
TRADE_INTERVAL_SECONDS=60     # Decision interval

# Risk Management
MAX_POSITION_SIZE_USD=50      # Max $ per trade
MAX_DAILY_LOSS_PERCENT=20     # Max % loss per day
MAX_OPEN_POSITIONS=3          # Max concurrent positions
```
