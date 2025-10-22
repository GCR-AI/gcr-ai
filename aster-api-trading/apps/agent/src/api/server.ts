import express from 'express';
import { PrismaClient } from '@prisma/client';
import { logger, config } from '../utils';
import { AsterClient } from '../aster/client';

const db = new PrismaClient();
const app = express();

const aster = new AsterClient({
  user: config.aster.user,
  signer: config.aster.signer,
  privateKey: config.aster.privateKey,
});

app.use(express.json());

// CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/**
 * Health check
 */
app.get('/api/health', async (req, res) => {
  try {
    const agentState = await db.agentState.findUnique({ where: { id: 'main' } });
    res.json({
      status: 'healthy',
      agent: {
        running: agentState?.isRunning || false,
        paused: agentState?.isPaused || false,
        lastHeartbeat: agentState?.lastHeartbeat,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: String(error) });
  }
});

/**
 * Get stats
 */
app.get('/api/stats', async (req, res) => {
  try {
    // Get balance from Aster (only USDT for futures trading)
    const balance = await aster.getBalance();
    const usdtBalance = balance.find(b => b.asset === 'USDT');
    const accountBalance = usdtBalance ? parseFloat(usdtBalance.availableBalance) : 0;

    // Get all positions from Aster
    const allPositions = await aster.getPositions();
    const openPositions = allPositions.filter(p => parseFloat(p.positionAmt) !== 0);

    // Calculate total P&L: realized (from closed trades) + unrealized (from open positions)
    const decisionsWithPnl = await db.decision.findMany({
      where: { pnl: { not: null } },
    });
    const realizedPnl = decisionsWithPnl.reduce((sum, d) => sum + (d.pnl || 0), 0);

    // Add unrealized P&L from open positions
    const unrealizedPnl = openPositions.reduce((sum, p) => sum + parseFloat(p.unRealizedProfit), 0);
    const totalPnl = realizedPnl + unrealizedPnl;

    // Calculate win rate from profitable decisions
    const decisionsWithResult = await db.decision.findMany({
      where: { profitable: { not: null } },
    });
    const winningDecisions = decisionsWithResult.filter(d => d.profitable === true);
    const winRate = decisionsWithResult.length > 0
      ? (winningDecisions.length / decisionsWithResult.length) * 100
      : 0;

    // Count total trades
    const totalTrades = await db.trade.count();

    res.json({
      balance: accountBalance,
      totalPnl,
      winRate,
      totalTrades,
      openPositions: openPositions.length,
    });
  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Get recent decisions
 */
app.get('/api/decisions', async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || '50');
    const decisions = await db.decision.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    res.json(decisions);
  } catch (error) {
    logger.error('Decisions error:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Get latest decision
 */
app.get('/api/decisions/latest', async (req, res) => {
  try {
    const decision = await db.decision.findFirst({
      orderBy: { timestamp: 'desc' },
      include: { trades: true },
    });
    res.json(decision);
  } catch (error) {
    logger.error('Latest decision error:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Get latest decision (alias)
 */
app.get('/api/latest', async (req, res) => {
  try {
    const decision = await db.decision.findFirst({
      orderBy: { timestamp: 'desc' },
      include: { trades: true },
    });
    res.json(decision);
  } catch (error) {
    logger.error('Latest decision error:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Get agent status
 */
app.get('/api/status', async (req, res) => {
  try {
    const agentState = await db.agentState.findUnique({ where: { id: 'main' } });
    if (!agentState) {
      return res.status(404).json({ error: 'Agent state not found' });
    }
    res.json({
      isRunning: agentState.isRunning,
      isPaused: agentState.isPaused,
      lastHeartbeat: agentState.lastHeartbeat,
      config: agentState.config,
    });
  } catch (error) {
    logger.error('Status error:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Get positions (from Aster API)
 */
app.get('/api/positions', async (req, res) => {
  try {
    // Get positions directly from Aster
    const allPositions = await aster.getPositions();
    // Filter to only open positions (non-zero amounts)
    const openPositions = allPositions.filter(p => parseFloat(p.positionAmt) !== 0);
    res.json(openPositions);
  } catch (error) {
    logger.error('Positions error:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Get trades (from Aster API)
 */
app.get('/api/trades', async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || '50');

    // Get trades for all symbols we're trading
    const symbols = config.trading.symbols || ['BTCUSDT', 'ETHUSDT'];
    const allTrades: any[] = [];

    for (const symbol of symbols) {
      try {
        const orders = await aster.getAllOrders({ symbol, limit: 50 });
        // Convert orders to trade format and add to array
        const trades = orders.map(order => ({
          id: order.orderId.toString(),
          timestamp: new Date(order.time),
          orderId: order.orderId.toString(),
          symbol: order.symbol,
          side: order.side,
          type: order.type,
          positionSide: 'BOTH',
          price: order.avgPrice || order.price,
          quantity: order.executedQty || order.origQty,
          quoteQty: order.cumQuote,
          commission: '0',
          commissionAsset: 'USDT',
          realizedPnl: null, 
          status: order.status,
          decisionId: '',
        }));
        allTrades.push(...trades);
      } catch (err) {
        logger.error(`Error fetching trades for ${symbol}:`, err);
      }
    }

    // Sort by timestamp descending and limit
    const sortedTrades = allTrades
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    res.json(sortedTrades);
  } catch (error) {
    logger.error('Trades error:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Get P&L history
 */
app.get('/api/pnl', async (req, res) => {
  try {
    const decisions = await db.decision.findMany({
      where: { pnl: { not: null } },
      orderBy: { timestamp: 'asc' },
      select: {
        timestamp: true,
        pnl: true,
      },
    });

    let cumulative = 0;
    const history = decisions.map(d => {
      cumulative += d.pnl || 0;
      return {
        timestamp: d.timestamp,
        pnl: cumulative,
      };
    });

    res.json(history);
  } catch (error) {
    logger.error('P&L error:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Control agent (pause/resume)
 */
app.post('/api/agent/control', async (req, res) => {
  try {
    const { action } = req.body;

    if (action === 'pause') {
      await db.agentState.update({
        where: { id: 'main' },
        data: { isPaused: true },
      });
      res.json({ status: 'paused' });
    } else if (action === 'resume') {
      await db.agentState.update({
        where: { id: 'main' },
        data: { isPaused: false },
      });
      res.json({ status: 'running' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    logger.error('Control error:', error);
    res.status(500).json({ error: String(error) });
  }
});

export function startServer(port: number = config.app.port) {
  app.listen(port, () => {
    logger.info(`🚀 API server running on http://localhost:${port}`);
  });
}

export default app;
