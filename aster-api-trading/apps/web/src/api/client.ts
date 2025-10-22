import type { Decision, Trade, Position, AgentStatus, Stats } from '../types';

const API_BASE = '/api';

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  getStatus: () => fetcher<AgentStatus>('/status'),

  getDecisions: (limit = 50) => fetcher<Decision[]>(`/decisions?limit=${limit}`),

  getLatest: () => fetcher<Decision | null>('/latest'),

  getTrades: () => fetcher<Trade[]>('/trades'),

  getPositions: () => fetcher<Position[]>('/positions'),

  getStats: () => fetcher<Stats>('/stats'),
};
