import { AsterSigner } from './signer';
import type {
  AsterConfig,
  OrderParams,
  Position,
  AccountBalance,
  MarketData,
  Order,
} from './types';

/**
 * Aster Finance API Client (V3 API)
 * Implements Web3-based authentication for futures trading
 */
export class AsterClient {
  private signer: AsterSigner;
  private baseUrl: string;

  constructor(config: AsterConfig) {
    this.signer = new AsterSigner(config.user, config.signer, config.privateKey);
    this.baseUrl = config.baseUrl || 'https://fapi.asterdex.com';
  }

  /**
   * Place a new order
   */
  async placeOrder(params: OrderParams): Promise<Order> {
    return this.signedRequest<Order>('/fapi/v3/order', 'POST', params);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(params: { symbol: string; orderId?: number; origClientOrderId?: string }): Promise<Order> {
    return this.signedRequest<Order>('/fapi/v3/order', 'DELETE', params);
  }

  /**
   * Get order details
   */
  async getOrder(params: { symbol: string; orderId?: number; origClientOrderId?: string }): Promise<Order> {
    return this.signedRequest<Order>('/fapi/v3/order', 'GET', params);
  }

  /**
   * Get all open orders
   */
  async getOpenOrders(symbol?: string): Promise<Order[]> {
    const params = symbol ? { symbol } : {};
    return this.signedRequest<Order[]>('/fapi/v3/openOrders', 'GET', params);
  }

  /**
   * Get all orders (historical)
   */
  async getAllOrders(params: { symbol: string; limit?: number }): Promise<Order[]> {
    return this.signedRequest<Order[]>('/fapi/v3/allOrders', 'GET', params);
  }

  /**
   * Get current positions
   */
  async getPositions(symbol?: string): Promise<Position[]> {
    const params = symbol ? { symbol } : {};
    return this.signedRequest<Position[]>('/fapi/v3/positionRisk', 'GET', params);
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<AccountBalance[]> {
    return this.signedRequest<AccountBalance[]>('/fapi/v3/balance', 'GET', {});
  }

  /**
   * Get account information
   */
  async getAccount(): Promise<any> {
    return this.signedRequest<any>('/fapi/v3/account', 'GET', {});
  }

  /**
   * Change leverage for a symbol
   */
  async changeLevel(symbol: string, leverage: number): Promise<any> {
    return this.signedRequest<any>('/fapi/v3/leverage', 'POST', { symbol, leverage });
  }

  /**
   * Change margin type (ISOLATED or CROSSED)
   */
  async changeMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<any> {
    return this.signedRequest<any>('/fapi/v3/marginType', 'POST', { symbol, marginType });
  }

  /**
   * Get market data for a symbol
   */
  async getMarketData(symbol?: string): Promise<MarketData | MarketData[]> {
    const url = symbol ? `/fapi/v1/ticker/24hr?symbol=${symbol}` : '/fapi/v1/ticker/24hr';
    return this.publicRequest<MarketData | MarketData[]>(url);
  }

  /**
   * Get exchange info (symbol precision, filters, etc)
   */
  async getExchangeInfo(symbol?: string): Promise<any> {
    const url = symbol ? `/fapi/v1/exchangeInfo?symbol=${symbol}` : '/fapi/v1/exchangeInfo';
    return this.publicRequest<any>(url);
  }

  /**
   * Get quantity precision for a symbol
   */
  async getQuantityPrecision(symbol: string): Promise<number> {
    try {
      const info = await this.getExchangeInfo(symbol);
      const symbolInfo = info.symbols?.find((s: any) => s.symbol === symbol);

      if (symbolInfo?.quantityPrecision !== undefined) {
        return symbolInfo.quantityPrecision;
      }

      // Fallback: parse stepSize from LOT_SIZE filter
      const lotSizeFilter = symbolInfo?.filters?.find((f: any) => f.filterType === 'LOT_SIZE');
      if (lotSizeFilter?.stepSize) {
        const stepSize = lotSizeFilter.stepSize;
        const decimals = (stepSize.split('.')[1] || '').replace(/0+$/, '').length;
        return decimals;
      }

      // Default fallback based on symbol
      return symbol.includes('BTC') ? 3 : 3;
    } catch (error) {
      // Default precision if API fails
      return symbol.includes('BTC') ? 3 : 3;
    }
  }

  /**
   * Get orderbook depth
   */
  async getDepth(symbol: string, limit: number = 20): Promise<any> {
    return this.publicRequest<any>(`/fapi/v1/depth?symbol=${symbol}&limit=${limit}`);
  }

  /**
   * Get mark price
   */
  async getMarkPrice(symbol?: string): Promise<any> {
    const url = symbol ? `/fapi/v1/premiumIndex?symbol=${symbol}` : '/fapi/v1/premiumIndex';
    return this.publicRequest<any>(url);
  }

  /**
   * Ping server
   */
  async ping(): Promise<{}> {
    return this.publicRequest<{}>('/fapi/v1/ping');
  }

  /**
   * Get server time
   */
  async getServerTime(): Promise<{ serverTime: number }> {
    return this.publicRequest<{ serverTime: number }>('/fapi/v1/time');
  }

  /**
   * Make a signed API request
   */
  private async signedRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE',
    params: Record<string, any>
  ): Promise<T> {
    const nonce = this.signer.generateNonce();

    // Add required fields
    const requestParams = {
      ...params,
      recvWindow: params.recvWindow || 50000,
      timestamp: Date.now(),
    };

    // Generate signature
    const signature = await this.signer.signRequest(requestParams, nonce);

    // Add authentication fields
    const finalParams = {
      ...requestParams,
      user: this.signer.getUserAddress(),
      signer: this.signer.getSignerAddress(),
      nonce: nonce.toString(),
      signature,
    };

    const url = `${this.baseUrl}${endpoint}`;

    if (method === 'GET' || method === 'DELETE') {
      // Query string for GET/DELETE
      const queryString = new URLSearchParams(
        Object.entries(finalParams).map(([k, v]) => [k, String(v)])
      ).toString();
      const fullUrl = `${url}?${queryString}`;

      const response = await fetch(fullUrl, { method });
      return this.handleResponse<T>(response);
    } else {
      // Form body for POST
      const body = new URLSearchParams(
        Object.entries(finalParams).map(([k, v]) => [k, String(v)])
      );

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'VibeTrader/1.0',
        },
        body,
      });

      return this.handleResponse<T>(response);
    }
  }

  /**
   * Make a public API request (no signature required)
   */
  private async publicRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url);
    return this.handleResponse<T>(response);
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const text = await response.text();

    if (!response.ok) {
      let errorMessage = `Aster API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = JSON.parse(text);
        errorMessage = `Aster API Error: ${errorData.code} - ${errorData.msg}`;
      } catch {
        errorMessage += `\n${text}`;
      }
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(text) as T;
    } catch (error) {
      throw new Error(`Failed to parse Aster API response: ${text}`);
    }
  }
}
