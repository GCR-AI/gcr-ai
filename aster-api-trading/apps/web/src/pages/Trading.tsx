import { format } from 'date-fns';
import { usePositions, useTrades } from '../hooks/useData';
import { formatNumber, formatCurrency } from '../utils/format';
import { SkeletonPosition, SkeletonTable } from '../components/Skeleton';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

export default function Trading() {
  const { data: positions, isLoading: positionsLoading } = usePositions();
  const { data: trades, isLoading: tradesLoading } = useTrades();

  return (
    <div className="space-y-8">
      {/* Open Positions */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gold">Open Positions</h2>
        {positionsLoading ? (
          <SkeletonPosition />
        ) : positions && positions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {positions.map((position, idx) => (
              <div key={idx} className="bg-dark-card rounded-xl p-6 border border-dark-border hover:border-gold/30 transition-all duration-300 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-2xl text-white mb-2">{position.symbol}</h3>
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      <span className={`${parseFloat(position.positionAmt) > 0 ? 'text-profit' : 'text-loss'} font-bold flex items-center gap-1`}>
                        {parseFloat(position.positionAmt) > 0 ? <><FaArrowUp /> LONG</> : <><FaArrowDown /> SHORT</>}
                      </span> • <span className="text-gold">{position.leverage}x</span> Leverage
                    </div>
                  </div>
                  <div className={`text-3xl font-bold ${parseFloat(position.unRealizedProfit) >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {parseFloat(position.unRealizedProfit) >= 0 ? '+' : ''}${formatNumber(position.unRealizedProfit)}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-dark-bg rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Size</div>
                    <div className="font-semibold text-white">{formatNumber(Math.abs(parseFloat(position.positionAmt)), 3)}</div>
                  </div>
                  <div className="bg-dark-bg rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Entry Price</div>
                    <div className="font-semibold text-gold-light">${formatNumber(position.entryPrice)}</div>
                  </div>
                  <div className="bg-dark-bg rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Mark Price</div>
                    <div className="font-semibold text-white">${formatNumber(position.markPrice)}</div>
                  </div>
                  <div className="bg-dark-bg rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Liq. Price</div>
                    <div className="font-semibold text-loss">${formatNumber(position.liquidationPrice)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-dark-card rounded-xl p-8 border border-dark-border text-center text-gray-400">
            No open positions
          </div>
        )}
      </div>

      {/* Trade History */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gold">Trade History</h2>
        {tradesLoading ? (
          <SkeletonTable />
        ) : trades && trades.length > 0 ? (
          <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-bg border-b border-dark-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gold uppercase tracking-wider">Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gold uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gold uppercase tracking-wider">Side</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gold uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gold uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gold uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gold uppercase tracking-wider">P&L</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-dark-hover transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {format(new Date(trade.timestamp), 'MMM dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">{trade.symbol}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        trade.side === 'BUY' ? 'bg-profit/20 text-profit border border-profit/40' : 'bg-loss/20 text-loss border border-loss/40'
                      }`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-300">{formatNumber(trade.quantity, 3)}</td>
                    <td className="px-6 py-4 text-right text-sm text-gold-light font-semibold">${formatNumber(trade.price)}</td>
                    <td className="px-6 py-4 text-right text-sm text-white font-semibold">
                      ${trade.quoteQty ? formatNumber(trade.quoteQty) : '-'}
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-bold ${
                      trade.realizedPnl && trade.realizedPnl > 0 ? 'text-profit' :
                      trade.realizedPnl && trade.realizedPnl < 0 ? 'text-loss' :
                      'text-gray-400'
                    }`}>
                      {trade.realizedPnl !== null && trade.realizedPnl !== undefined
                        ? `${trade.realizedPnl >= 0 ? '+' : ''}$${formatNumber(trade.realizedPnl)}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                        trade.status === 'FILLED' ? 'bg-profit/20 text-profit border border-profit/40' : 'bg-dark-border text-gray-400 border border-dark-border'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          <div className="bg-dark-card rounded-xl p-8 border border-dark-border text-center text-gray-400">
            No trades yet
          </div>
        )}
      </div>
    </div>
  );
}
