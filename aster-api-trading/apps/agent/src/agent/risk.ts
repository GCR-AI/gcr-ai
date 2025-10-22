import type { Position, AccountBalance } from '../aster/types';

export interface RiskConfig {
  maxPositionSizeUSD: number; // Max $ per trade
  maxDailyLossPercent: number; // Max % loss per day
  maxOpenPositions: number; // Max concurrent positions
  minConfidence: number; // Min confidence to execute (0-1)
  stopLossPercent: number; // Default stop loss %
  takeProfitPercent: number; // Default take profit %
}

export interface RiskCheck {
  allowed: boolean;
  reason?: string;
  adjustedSize?: number;
}

/**
 * Risk Management System
 * Prevents the agent from blowing up the account
 */
export class RiskManager {
  constructor(private config: RiskConfig) {}

  /**
   * Check if a trade is allowed based on risk rules
   */
  canTrade(
    action: string,
    sizeUSD: number,
    confidence: number,
    positions: Position[],
    balance: number,
    dailyPnl: number
  ): RiskCheck {
    // 1. Check confidence threshold
    if (confidence < this.config.minConfidence) {
      return {
        allowed: false,
        reason: `Confidence ${confidence.toFixed(2)} below threshold ${this.config.minConfidence}`,
      };
    }

    // 2. Check HOLD action (always allowed)
    if (action === 'HOLD') {
      return { allowed: true };
    }

    // 3. Check daily loss limit
    const dailyLossPercent = (dailyPnl / balance) * 100;
    if (dailyLossPercent <= -this.config.maxDailyLossPercent) {
      return {
        allowed: false,
        reason: `Daily loss limit reached: ${dailyLossPercent.toFixed(2)}% (max: -${this.config.maxDailyLossPercent}%)`,
      };
    }

    // 4. Check position count limit (for new positions)
    if (action === 'BUY' || action === 'SELL') {
      const openPositions = positions.filter(p => parseFloat(p.positionAmt) !== 0);
      if (openPositions.length >= this.config.maxOpenPositions) {
        return {
          allowed: false,
          reason: `Max open positions reached: ${openPositions.length}/${this.config.maxOpenPositions}`,
        };
      }
    }

    // 5. Check position size limit
    if (sizeUSD > this.config.maxPositionSizeUSD) {
      return {
        allowed: true,
        adjustedSize: this.config.maxPositionSizeUSD,
        reason: `Position size reduced from $${sizeUSD.toFixed(2)} to $${this.config.maxPositionSizeUSD.toFixed(2)}`,
      };
    }

    // 6. Check account balance (2% rule)
    const maxRiskPerTrade = balance * 0.02; // Never risk more than 2%
    if (sizeUSD > maxRiskPerTrade) {
      return {
        allowed: true,
        adjustedSize: maxRiskPerTrade,
        reason: `Position size reduced to 2% of account: $${maxRiskPerTrade.toFixed(2)}`,
      };
    }

    // All checks passed
    return { allowed: true };
  }

  /**
   * Calculate stop loss price
   */
  calculateStopLoss(entryPrice: number, side: 'BUY' | 'SELL'): number {
    if (side === 'BUY') {
      return entryPrice * (1 - this.config.stopLossPercent / 100);
    } else {
      return entryPrice * (1 + this.config.stopLossPercent / 100);
    }
  }

  /**
   * Calculate take profit price
   */
  calculateTakeProfit(entryPrice: number, side: 'BUY' | 'SELL'): number {
    if (side === 'BUY') {
      return entryPrice * (1 + this.config.takeProfitPercent / 100);
    } else {
      return entryPrice * (1 - this.config.takeProfitPercent / 100);
    }
  }

  /**
   * Calculate position size in quantity based on USD value
   */
  calculateQuantity(usdValue: number, price: number): number {
    return usdValue / price;
  }

  /**
   * Check for circuit breaker conditions
   */
  shouldPause(
    consecutiveLosses: number,
    drawdownPercent: number,
    errorCount: number
  ): { pause: boolean; reason?: string } {
    // Pause if 3+ consecutive losses
    if (consecutiveLosses >= 3) {
      return {
        pause: true,
        reason: `Circuit breaker: ${consecutiveLosses} consecutive losses`,
      };
    }

    // Pause if drawdown > 15%
    if (drawdownPercent > 15) {
      return {
        pause: true,
        reason: `Circuit breaker: ${drawdownPercent.toFixed(2)}% drawdown`,
      };
    }

    // Pause if 5+ errors in short time
    if (errorCount >= 5) {
      return {
        pause: true,
        reason: `Circuit breaker: ${errorCount} recent errors`,
      };
    }

    return { pause: false };
  }

  /**
   * Get recommended position size based on Kelly Criterion
   * (simplified version for crypto)
   */
  getKellySize(
    winRate: number,
    avgWin: number,
    avgLoss: number,
    balance: number
  ): number {
    if (winRate <= 0 || avgWin <= 0 || avgLoss <= 0) {
      return balance * 0.01; // Default to 1% if no data
    }

    const winProb = winRate / 100;
    const lossProb = 1 - winProb;
    const winLossRatio = avgWin / avgLoss;

    // Kelly % = W - [(1 - W) / R]
    // W = win probability, R = win/loss ratio
    const kellyPercent = winProb - (lossProb / winLossRatio);

    // Use half-Kelly for safety (Kelly can be aggressive)
    const halfKelly = kellyPercent / 2;

    // Cap at 5% of balance
    const cappedKelly = Math.min(Math.max(halfKelly, 0), 0.05);

    return balance * cappedKelly;
  }
}
