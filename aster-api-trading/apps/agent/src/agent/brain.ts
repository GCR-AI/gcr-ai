import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { MarketData, Position } from '../aster/types';

// Decision schema for validation
const DecisionSchema = z.object({
  action: z.enum(['BUY', 'SELL', 'HOLD', 'CLOSE']),
  symbol: z.string(),
  size: z.number().nonnegative().optional(), 
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  vibe: z.enum(['bullish', 'bearish', 'neutral', 'chaos']),
  timeframe: z.enum(['scalp', 'short', 'medium', 'long']),
  stopLoss: z.number().optional(), 
  takeProfit: z.number().optional(), 
  riskLevel: z.enum(['low', 'medium', 'high']),
});

export type TradingDecision = z.infer<typeof DecisionSchema>;

interface MarketContext {
  currentPrice: number;
  priceChange: number;
  volume: string;
  high: string;
  low: string;
}

interface RiskMetrics {
  accountBalance: number;
  maxPositionSize: number;
  currentDrawdown: number;
  openPositions: number;
}

/**
 * Claude AI Brain - Makes trading decisions
 */
export class ClaudeBrain {
  private client: Anthropic;
  private model: string = 'claude-sonnet-4-5-20250929';

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Make a trading decision based on market data
   */
  async decide(
    symbol: string,
    marketData: MarketContext,
    positions: Position[],
    riskMetrics: RiskMetrics,
    recentPerformance?: {
      winRate: number;
      totalPnl: number;
      lastTrades: number;
    }
  ): Promise<{ decision: TradingDecision; prompt: string; rawResponse: string }> {
    const prompt = this.buildPrompt(symbol, marketData, positions, riskMetrics, recentPerformance);

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        temperature: 0.7,
        system: this.getSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const rawResponse = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract JSON from response
      const decision = this.parseDecision(rawResponse);

      return {
        decision,
        prompt,
        rawResponse,
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Failed to get trading decision: ${error}`);
    }
  }

  /**
   * System prompt defining agent personality and rules
   */
  private getSystemPrompt(): string {
    return `You are "Vibe Trader" - an AI-powered crypto trading agent with a unique personality.

PERSONALITY:
- Analytical but not afraid to take calculated risks
- Explains reasoning clearly using chain-of-thought
- Confident in decisions while honest about uncertainty
- Adapts strategy to market conditions
- Has a sense of humor about crypto market chaos
- Uses phrases like "the vibes are immaculate" or "vibes are off" when appropriate

TRADING RULES (CRITICAL - MUST FOLLOW):
1. NEVER risk more than 2% of account balance on a single trade
2. ALWAYS use stop-losses for risk management
3. Consider market volatility before sizing positions
4. Be honest about confidence level (0-1 scale)
5. Only execute trades with confidence >= 0.7
6. Respect daily loss limits and drawdown thresholds
7. Avoid FOMO - stick to your analysis

RESPONSE FORMAT:
You MUST respond with a valid JSON object only. No markdown, no code blocks, just pure JSON.

Example for BUY:
{
  "action": "BUY",
  "symbol": "BTCUSDT",
  "size": 0.01,
  "confidence": 0.85,
  "reasoning": "Strong bullish momentum confirmed by RSI oversold bounce and volume spike. Risk/reward is favorable at current levels.",
  "vibe": "bullish",
  "timeframe": "short",
  "stopLoss": 95000.0,
  "takeProfit": 105000.0,
  "riskLevel": "medium"
}

Example for HOLD (when uncertain):
{
  "action": "HOLD",
  "symbol": "BTCUSDT",
  "confidence": 0.4,
  "reasoning": "Market consolidating, waiting for clearer direction before entry.",
  "vibe": "neutral",
  "timeframe": "short",
  "riskLevel": "low"
}

IMPORTANT:
- vibe MUST be: "bullish", "bearish", "neutral", or "chaos" (no other values!)
- timeframe MUST be: "scalp", "short", "medium", or "long" (no other values!)
- riskLevel MUST be: "low", "medium", or "high" (no other values!)
- For HOLD actions, size/stopLoss/takeProfit are optional

REASONING GUIDELINES:
- Explain your analysis step-by-step
- Reference specific data points (price, volume, indicators)
- Explain why this is the right time to act (or not act)
- Consider current position and account state
- Be concise but thorough (2-4 sentences)`;
  }

  /**
   * Build the user prompt with market context
   */
  private buildPrompt(
    symbol: string,
    market: MarketContext,
    positions: Position[],
    risk: RiskMetrics,
    performance?: { winRate: number; totalPnl: number; lastTrades: number }
  ): string {
    const currentPosition = positions.find(p => p.symbol === symbol);

    return `
Current Market State for ${symbol}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Price: $${market.currentPrice.toFixed(2)}
24h Change: ${market.priceChange > 0 ? '+' : ''}${market.priceChange.toFixed(2)}%
24h High: $${market.high}
24h Low: $${market.low}
24h Volume: ${market.volume}

Current Position:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${currentPosition ? `
Position Side: ${currentPosition.positionSide}
Amount: ${currentPosition.positionAmt}
Entry Price: $${currentPosition.entryPrice}
Mark Price: $${currentPosition.markPrice}
Unrealized P&L: ${currentPosition.unRealizedProfit}
Leverage: ${currentPosition.leverage}x
` : 'No open position'}

Account Risk Metrics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Available Balance: $${risk.accountBalance.toFixed(2)}
Max Position Size: $${risk.maxPositionSize.toFixed(2)}
Current Drawdown: ${risk.currentDrawdown.toFixed(2)}%
Open Positions: ${risk.openPositions}/${3}

${performance ? `
Recent Performance:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Win Rate: ${performance.winRate.toFixed(1)}%
Total P&L: $${performance.totalPnl.toFixed(2)}
Last ${performance.lastTrades} Trades
` : ''}

TASK:
Analyze the current market state and make a trading decision. Consider:
1. Market momentum and direction
2. Risk/reward ratio
3. Your current position (if any)
4. Account balance and risk limits
5. Recent performance trend

Think step-by-step:
1. What is the market telling us right now?
2. Is this a good entry/exit point?
3. What's the risk if we're wrong?
4. What's the upside if we're right?

Respond with JSON only (no markdown formatting).`;
  }

  /**
   * Parse and validate decision from Claude response
   */
  private parseDecision(response: string): TradingDecision {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);
      const validated = DecisionSchema.parse(parsed);

      return validated;
    } catch (error) {
      console.error('Failed to parse decision:', response);
      console.error('Parse error:', error);

      // Return safe HOLD decision as fallback
      return {
        action: 'HOLD',
        symbol: 'BTCUSDT',
        confidence: 0.0,
        reasoning: 'Failed to parse AI decision - defaulting to HOLD for safety',
        vibe: 'neutral',
        timeframe: 'short',
        riskLevel: 'low',
      };
    }
  }
}
