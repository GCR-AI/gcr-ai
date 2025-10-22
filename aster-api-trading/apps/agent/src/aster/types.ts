// Aster API Types
export interface AsterConfig {
  user: string; // Main wallet address
  signer: string; // API wallet address
  privateKey: string; // API wallet private key
  baseUrl?: string;
}

export interface OrderParams {
  symbol: string;
  positionSide: 'BOTH' | 'LONG' | 'SHORT';
  type: 'LIMIT' | 'MARKET' | 'STOP' | 'STOP_MARKET' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
  side: 'BUY' | 'SELL';
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'GTX';
  quantity: string;
  price?: string;
  stopPrice?: string;
  reduceOnly?: boolean;
  recvWindow?: number;
  timestamp?: number;
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

export interface AccountBalance {
  asset: string;
  balance: string;
  availableBalance: string;
  crossWalletBalance: string;
}

export interface MarketData {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface Order {
  orderId: number;
  symbol: string;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED';
  clientOrderId: string;
  price: string;
  avgPrice: string;
  origQty: string;
  executedQty: string;
  cumQuote: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  time: number;
  updateTime: number;
}
