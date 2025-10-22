import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: api.getStatus,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
  });
}

export function useDecisions(limit = 10) {
  return useQuery({
    queryKey: ['decisions', limit],
    queryFn: () => api.getDecisions(limit),
  });
}

export function useLatest() {
  return useQuery({
    queryKey: ['latest'],
    queryFn: api.getLatest,
    refetchInterval: 10000,
  });
}

export function useTrades() {
  return useQuery({
    queryKey: ['trades'],
    queryFn: api.getTrades,
  });
}

export function usePositions() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: api.getPositions,
  });
}
