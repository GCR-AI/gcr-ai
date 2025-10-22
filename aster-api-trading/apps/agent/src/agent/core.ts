import { AsterClient } from '../aster';
import { ClaudeBrain } from './brain';
import { RiskManager, type RiskConfig } from './risk';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

interface AgentConfig {
  asterConfig: {
    user: string;
    signer: string;
    privateKey: string;
  };
  claudeApiKey: string;
  riskConfig: RiskConfig;
  tradingSymbols: string[];
  intervalSeconds: number;
  dryRun: boolean;
}

/**
 * Core Trading Agent
 * Autonomous loop that makes and executes trading decisions
 */
export class TradingAgent {
  private aster: AsterClient;
  private brain: ClaudeBrain;
  private risk: RiskManager;
  private db: PrismaClient;
  private config: AgentConfig;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  constructor(config: AgentConfig) {
    this.config = config;
    this.aster = new AsterClient(config.asterConfig);
    this.brain = new ClaudeBrain(config.claudeApiKey);
    this.risk = new RiskManager(config.riskConfig);
    this.db = new PrismaClient();
  }

  /**
   * Start the trading loop
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Agent already running');
      return;
    }

    this.isRunning = true;
    logger.info('🤖 Vibe Trader starting...');

    // Initialize agent state
    await this.db.agentState.upsert({
      where: { id: 'main' },
      create: {
        id: 'main',
        isRunning: true,
        isPaused: false,
        config: this.config as any,
      },
      update: {
        isRunning: true,
        isPaused: false,
        lastHeartbeat: new Date(),
      },
    });

    // Main loop
    while (this.isRunning) {
      try {
        if (!this.isPaused) {
          await this.tick();
        }

        // Wait for next interval
        await this.sleep(this.config.intervalSeconds * 1000);

        // Update heartbeat
        await this.db.agentState.update({
          where: { id: 'main' },
          data: { lastHeartbeat: new Date() },
        });
      } catch (error) {
        logger.error('Error in agent loop:', error);
        await this.handleError(error);
      }
    }

    logger.info('🤖 Vibe Trader stopped');
  }

  /**
   * Single tick of the trading loop
   */
  private async tick(): Promise<void> {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('⚡ New trading cycle');

    for (const symbol of this.config.tradingSymbols) {
      try {
        await this.processSymbol(symbol);
      } catch (error) {
        logger.error(`Error processing ${symbol}:`, error);
      }
    }

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Process a single symbol
   */
  private async processSymbol(symbol: string): Promise<void> {
    logger.info(`\n📊 Analyzing ${symbol}...`);

    // 1. Gather market data
    const marketData = await this.aster.getMarketData(symbol);

    // In dry run mode, skip authenticated calls and use mock data
    const positions = this.config.dryRun
      ? []
      : await this.aster.getPositions(symbol);

    const balance = this.config.dryRun
      ? [{ asset: 'USDT', balance: '1000', availableBalance: '1000', crossWalletBalance: '1000' }]
      : await this.aster.getBalance();

    // DEBUG: Log actual balance response
    logger.info('🔍 Balance response:', JSON.stringify(balance, null, 2));

    // Parse market data (handle both single object and array responses)
    const data = Array.isArray(marketData) ? marketData[0] : marketData;

    const marketContext = {
      currentPrice: parseFloat(data.lastPrice || '0'),
      priceChange: parseFloat(data.priceChangePercent || '0'),
      volume: data.volume || '0',
      high: data.highPrice || '0',
      low: data.lowPrice || '0',
    };

    // 2. Calculate risk metrics
    const accountBalance = balance.reduce((sum, b) => sum + parseFloat(b.availableBalance), 0);
    const openPositions = positions.filter(p => parseFloat(p.positionAmt) !== 0);

    // Get recent performance
    const recentDecisions = await this.db.decision.findMany({
      where: { symbol, profitable: { not: null } },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    const winningDecisions = recentDecisions.filter(d => d.profitable === true);
    const winRate = recentDecisions.length > 0 ? (winningDecisions.length / recentDecisions.length) * 100 : 0;
    const totalPnl = recentDecisions.reduce((sum, d) => sum + (d.pnl || 0), 0);

    const riskMetrics = {
      accountBalance,
      maxPositionSize: this.config.riskConfig.maxPositionSizeUSD,
      currentDrawdown: 0, // TODO: Calculate from trades
      openPositions: openPositions.length,
    };

    // 3. Get AI decision
    logger.info('🧠 Consulting Claude...');
    const { decision, prompt, rawResponse } = await this.brain.decide(
      symbol,
      marketContext,
      positions,
      riskMetrics,
      { winRate, totalPnl, lastTrades: recentDecisions.length }
    );

    logger.info(`💭 Decision: ${decision.action} (confidence: ${decision.confidence.toFixed(2)})`);
    logger.info(`🎯 Vibe: ${decision.vibe} | Risk: ${decision.riskLevel}`);
    logger.info(`💬 Reasoning: ${decision.reasoning}`);

    // 4. Save decision to database
    const decisionRecord = await this.db.decision.create({
      data: {
        symbol,
        price: isNaN(marketContext.currentPrice) ? 0 : marketContext.currentPrice,
        marketData: marketContext as any,
        prompt,
        llmResponse: rawResponse,
        reasoning: decision.reasoning,
        action: decision.action,
        side: decision.action === 'BUY' || decision.action === 'SELL' ? decision.action : null,
        quantity: decision.size?.toString(),
        confidence: decision.confidence,
        vibe: decision.vibe,
        timeframe: decision.timeframe,
        stopLoss: decision.stopLoss,
        takeProfit: decision.takeProfit,
        riskLevel: decision.riskLevel,
        trades: { create: [] }, // Initialize empty trades relation
      },
    });

    // 5. Risk check
    if (decision.action !== 'HOLD') {
      const positionSizeUSD = decision.size ? decision.size * marketContext.currentPrice : this.config.riskConfig.maxPositionSizeUSD;
      const dailyPnl = await this.getDailyPnl();

      const riskCheck = this.risk.canTrade(
        decision.action,
        positionSizeUSD,
        decision.confidence,
        positions,
        accountBalance,
        dailyPnl
      );

      if (!riskCheck.allowed) {
        logger.warn(`🚫 Trade blocked: ${riskCheck.reason}`);
        return;
      }

      if (riskCheck.adjustedSize) {
        logger.info(`⚖️ Position size adjusted: $${riskCheck.adjustedSize.toFixed(2)}`);
      }

      // 6. Execute trade
      if (!this.config.dryRun) {
        await this.executeTrade(symbol, decision, marketContext.currentPrice, decisionRecord.id);
      } else {
        logger.info('🔧 DRY RUN MODE - Trade not executed');
      }
    }

    // 7. Check circuit breakers
    const consecutiveLosses = await this.getConsecutiveLosses();
    const drawdown = 0; // TODO: Calculate
    const errorCount = 0; // TODO: Track errors

    const circuitBreaker = this.risk.shouldPause(consecutiveLosses, drawdown, errorCount);
    if (circuitBreaker.pause) {
      logger.warn(`🛑 CIRCUIT BREAKER TRIGGERED: ${circuitBreaker.reason}`);
      this.pause();
    }
  }

  /**
   * Execute a trade
   */
  private async executeTrade(
    symbol: string,
    decision: any,
    currentPrice: number,
    decisionId: string
  ): Promise<void> {
    try {
      logger.info(`🚀 Executing ${decision.action} for ${symbol}...`);

      let quantity = decision.size || this.risk.calculateQuantity(this.config.riskConfig.maxPositionSizeUSD, currentPrice);

      if (decision.action === 'BUY' || decision.action === 'SELL') {
        // Get correct precision for this symbol
        const precision = await this.aster.getQuantityPrecision(symbol);
        logger.info(`📏 Using ${precision} decimal places for ${symbol}`);

        // Round quantity to correct precision
        let roundedQty = parseFloat(quantity.toFixed(precision));
        let notionalValue = roundedQty * currentPrice;

        // Aster's minimum notional requirement is $5 USD
        const minNotional = 5;

        logger.info(`💰 Initial notional: $${notionalValue.toFixed(2)} (quantity: ${roundedQty})`);

        // If notional value is below minimum after rounding, calculate minimum quantity needed
        if (notionalValue < minNotional) {
          const minQty = minNotional / currentPrice;
          // Round UP to ensure we meet the minimum
          roundedQty = Math.ceil(minQty * Math.pow(10, precision)) / Math.pow(10, precision);
          notionalValue = roundedQty * currentPrice;
          logger.info(`📊 Adjusted to meet $${minNotional} minimum: ${roundedQty} (notional: $${notionalValue.toFixed(2)})`);
        }

        const order = await this.aster.placeOrder({
          symbol,
          side: decision.action,
          type: 'MARKET',
          positionSide: 'BOTH',
          quantity: roundedQty.toFixed(precision),
        });

        logger.info(`✅ Order placed: ${order.orderId}`);

        // Save trade linked to decision
        await this.db.trade.create({
          data: {
            orderId: order.orderId.toString(),
            symbol: order.symbol,
            side: order.side,
            type: order.type,
            positionSide: 'BOTH',
            price: order.avgPrice || currentPrice.toString(),
            quantity: order.origQty,
            quoteQty: order.cumQuote,
            commission: '0',
            commissionAsset: 'USDT',
            status: order.status,
            decisionId: decisionId, // Link to decision
          },
        });

        // Update decision
        await this.db.decision.update({
          where: { id: decisionId },
          data: {
            executed: true,
            orderId: order.orderId.toString(),
          },
        });
      } else if (decision.action === 'CLOSE') {
        // Get correct precision for this symbol
        const precision = await this.aster.getQuantityPrecision(symbol);

        // Close all positions for this symbol
        const positions = await this.aster.getPositions(symbol);
        for (const pos of positions) {
          if (parseFloat(pos.positionAmt) !== 0) {
            const side = parseFloat(pos.positionAmt) > 0 ? 'SELL' : 'BUY';
            const qty = Math.abs(parseFloat(pos.positionAmt));

            const order = await this.aster.placeOrder({
              symbol,
              side,
              type: 'MARKET',
              positionSide: pos.positionSide as any,
              quantity: qty.toFixed(precision),
            });

            logger.info(`✅ Position closed: ${order.orderId}`);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to execute trade:', error);
      throw error;
    }
  }

  /**
   * Get daily P&L
   */
  private async getDailyPnl(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trades = await this.db.trade.findMany({
      where: {
        timestamp: { gte: today },
      },
    });

    return trades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0);
  }

  /**
   * Get consecutive losses
   */
  private async getConsecutiveLosses(): Promise<number> {
    const recentDecisions = await this.db.decision.findMany({
      where: { profitable: { not: null } },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    let losses = 0;
    for (const decision of recentDecisions) {
      if (decision.profitable === false) {
        losses++;
      } else {
        break;
      }
    }

    return losses;
  }

  /**
   * Pause the agent
   */
  pause(): void {
    this.isPaused = true;
    logger.warn('⏸️ Agent paused');
  }

  /**
   * Resume the agent
   */
  resume(): void {
    this.isPaused = false;
    logger.info('▶️ Agent resumed');
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    await this.db.agentState.update({
      where: { id: 'main' },
      data: { isRunning: false },
    });
  }

  /**
   * Handle errors
   */
  private async handleError(error: any): Promise<void> {
    await this.db.alert.create({
      data: {
        type: 'ERROR',
        severity: 'HIGH',
        message: error.message || String(error),
        metadata: { stack: error.stack },
      },
    });

    // Pause if critical error
    if (error.message?.includes('API') || error.message?.includes('balance')) {
      this.pause();
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
