import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const possiblePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(__dirname, '../../../../.env'),
];

for (const envPath of possiblePaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`✅ Loaded .env from: ${envPath}`);
    break;
  }
}

const EnvSchema = z.object({
  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),

  // Aster (optional for testing)
  ASTER_USER_ADDRESS: z.string().startsWith('0x', 'Invalid user address').optional(),
  ASTER_SIGNER_ADDRESS: z.string().startsWith('0x', 'Invalid signer address').optional(),
  ASTER_PRIVATE_KEY: z.string().startsWith('0x', 'Invalid private key').optional(),

  // Database
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),

  // Redis
  REDIS_URL: z.string().url('Invalid REDIS_URL').optional(),

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),

  // Risk Management
  MAX_POSITION_SIZE_USD: z.string().default('50'),
  MAX_DAILY_LOSS_PERCENT: z.string().default('20'),
  MAX_OPEN_POSITIONS: z.string().default('3'),

  // Trading
  TRADING_ENABLED: z.string().default('false'),
  DRY_RUN_MODE: z.string().default('true'),
  TRADE_INTERVAL_SECONDS: z.string().default('60'),
});

const env = EnvSchema.parse(process.env);

export const config = {
  anthropic: {
    apiKey: env.ANTHROPIC_API_KEY,
  },
  aster: {
    user: env.ASTER_USER_ADDRESS || '0x0000000000000000000000000000000000000000',
    signer: env.ASTER_SIGNER_ADDRESS || '0x0000000000000000000000000000000000000000',
    privateKey: env.ASTER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
  database: {
    url: env.DATABASE_URL,
  },
  redis: {
    url: env.REDIS_URL || 'redis://localhost:6379',
  },
  app: {
    env: env.NODE_ENV,
    port: parseInt(env.PORT),
  },
  risk: {
    maxPositionSizeUSD: parseFloat(env.MAX_POSITION_SIZE_USD),
    maxDailyLossPercent: parseFloat(env.MAX_DAILY_LOSS_PERCENT),
    maxOpenPositions: parseInt(env.MAX_OPEN_POSITIONS),
    minConfidence: 0.7,
    stopLossPercent: 3,
    takeProfitPercent: 5,
  },
  trading: {
    enabled: env.TRADING_ENABLED === 'true',
    dryRun: env.DRY_RUN_MODE === 'true',
    intervalSeconds: parseInt(env.TRADE_INTERVAL_SECONDS),
    symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
  },
};
