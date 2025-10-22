import { TradingAgent } from './agent/core';
import { startServer } from './api/server';
import { config, logger } from './utils';

async function main() {
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('🤖 GCR AI - AI Autonomous Trading Agent');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info(`Environment: ${config.app.env}`);
  logger.info(`Dry Run: ${config.trading.dryRun}`);
  logger.info(`Trading Enabled: ${config.trading.enabled}`);
  logger.info(`Symbols: ${config.trading.symbols.join(', ')}`);
  logger.info(`Interval: ${config.trading.intervalSeconds}s`);
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  startServer();

  if (config.trading.enabled) {
    const agent = new TradingAgent({
      asterConfig: config.aster,
      claudeApiKey: config.anthropic.apiKey,
      riskConfig: config.risk,
      tradingSymbols: config.trading.symbols,
      intervalSeconds: config.trading.intervalSeconds,
      dryRun: config.trading.dryRun,
    });

    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
      logger.info('\n🛑 Shutting down gracefully...');
      await agent.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('\n🛑 Shutting down gracefully...');
      await agent.stop();
      process.exit(0);
    });

    // Start agent
    await agent.start();
  } else {
    logger.warn('⚠️ Trading disabled - API server only mode');
    logger.info('💡 Set TRADING_ENABLED=true to start trading');
  }
}

// Run
main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
