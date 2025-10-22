export interface Decision {
  id: string;
  timestamp: Date;
  symbol: string;
  price: number;
  marketData: MarketData;
  prompt: string;
  llmResponse: string;
  reasoning: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE';
  side: 'BUY' | 'SELL' | null;
  quantity: string | null;
  confidence: number;
  vibe: 'bullish' | 'bearish' | 'neutral' | 'chaos';
  timeframe: 'scalp' | 'short' | 'medium' | 'long';
  stopLoss: number | null;
  takeProfit: number | null;
  riskLevel: 'low' | 'medium' | 'high';
  executed: boolean;
  orderId: string | null;
  profitable: boolean | null;
  pnl: number | null;
  trades: Trade[];
}

export interface MarketData {
  currentPrice: number;
  priceChange: number;
  volume: string;
  high: string;
  low: string;
}

export interface Trade {
  id: string;
  timestamp: Date;
  orderId: string;
  symbol: string;
  side: string;
  type: string;
  positionSide: string;
  price: string;
  quantity: string;
  quoteQty: string | null;
  commission: string;
  commissionAsset: string;
  realizedPnl: number | null;
  status: string;
  decisionId: string;
}

export interface Position {
  symbol: string;
  positionSide: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  marginType: string;
}

export interface AgentStatus {
  isRunning: boolean;
  isPaused: boolean;
  lastHeartbeat: Date;
  config: {
    tradingSymbols: string[];
    intervalSeconds: number;
    dryRun: boolean;
    riskConfig: {
      maxPositionSizeUSD: number;
      maxDailyLossPercent: number;
      maxOpenPositions: number;
    };
  };
}

export interface Stats {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  balance: number;
  openPositions: number;
}
