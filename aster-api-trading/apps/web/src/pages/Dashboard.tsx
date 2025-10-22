import { useStats, useDecisions, usePositions, useStatus, useTrades } from '../hooks/useData';
import StatCard from '../components/StatCard';
import DecisionCard from '../components/DecisionCard';
import { formatNumber, formatCurrency } from '../utils/format';
import { SkeletonStat, SkeletonPosition, SkeletonDecision } from '../components/Skeleton';
import { HiCurrencyDollar, HiTrendingUp } from 'react-icons/hi';
import { BiRefresh } from 'react-icons/bi';
import { RiRobot2Fill } from 'react-icons/ri';
import { BsPauseFill, BsStopFill } from 'react-icons/bs';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

export default function Dashboard() {
  const { data: status, isLoading: statusLoading } = useStatus();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: decisions, isLoading: decisionsLoading } = useDecisions(5);
  const { data: positions, isLoading: positionsLoading } = usePositions();
  const { data: trades } = useTrades();

  const closedTrades = trades?.filter(t => t.realizedPnl !== null && t.realizedPnl !== undefined) || [];
  const winningTrades = closedTrades.filter(t => t.realizedPnl! > 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  if (statusLoading || statsLoading) {
    return (
      <div className="space-y-8">
        <div className="bg-dark-card rounded-xl p-6 border border-dark-border shadow-lg animate-pulse">
          <div className="h-8 bg-dark-border rounded w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
        <div>
          <div className="h-8 bg-dark-border rounded w-40 mb-6 animate-pulse"></div>
          <SkeletonPosition />
        </div>
        <div>
          <div className="h-8 bg-dark-border rounded w-40 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            <SkeletonDecision />
            <SkeletonDecision />
            <SkeletonDecision />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Status Banner */}
      <div className={`p-6 rounded-xl border shadow-lg ${
        status?.isRunning && !status?.isPaused
          ? 'bg-gradient-to-r from-profit/10 to-profit/5 border-profit/30'
          : 'bg-dark-card border-dark-border'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-4 h-4 rounded-full ${
              status?.isRunning && !status?.isPaused ? 'bg-profit animate-pulse shadow-lg shadow-profit/50' : 'bg-gray-500'
            }`} />
            <span className="font-semibold text-lg flex items-center gap-2">
              {status?.isRunning && !status?.isPaused ? (
                <><RiRobot2Fill className="text-profit" /> Agent is TRADING</>
              ) : status?.isPaused ? (
                <><BsPauseFill className="text-yellow-500" /> Agent PAUSED</>
              ) : (
                <><BsStopFill className="text-gray-500" /> Agent STOPPED</>
              )}
            </span>
          </div>
          {status?.lastHeartbeat && (
            <span className="text-sm text-gray-400">
              Last heartbeat: {new Date(status.lastHeartbeat).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Balance"
          value={formatNumber(stats?.balance || 0)}
          icon={<HiCurrencyDollar />}
          prefix="$"
        />
        <StatCard
          label="Total P&L"
          value={formatNumber(stats?.totalPnl || 0)}
          icon={<HiTrendingUp />}
          prefix="$"
          change={stats?.totalPnl}
        />
        <StatCard
          label="Total Trades"
          value={formatNumber(stats?.totalTrades || 0, 0)}
          icon={<BiRefresh />}
        />
      </div>

      {/* Open Positions */}
      <div>
        <h3 className="text-xl font-bold mb-6 text-gold">Open Positions</h3>
        {positionsLoading ? (
          <SkeletonPosition />
        ) : positions && positions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {positions.map((position, idx) => (
              <div key={idx} className="bg-dark-card rounded-xl p-6 border border-dark-border hover:border-gold/30 transition-all duration-300 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xl text-white mb-1">{position.symbol}</div>
                    <div className="text-sm text-gray-400">
                      <span className={`${parseFloat(position.positionAmt) > 0 ? 'text-profit' : 'text-loss'} font-semibold flex items-center gap-1 inline-flex`}>
                        {parseFloat(position.positionAmt) > 0 ? <><FaArrowUp /> LONG</> : <><FaArrowDown /> SHORT</>}
                      </span> {formatNumber(Math.abs(parseFloat(position.positionAmt)), 3)} @ <span className="text-gold-light">${formatNumber(position.entryPrice)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-2xl ${parseFloat(position.unRealizedProfit) >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {parseFloat(position.unRealizedProfit) >= 0 ? '+' : ''}${formatNumber(position.unRealizedProfit)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Mark: <span className="text-white">${formatNumber(position.markPrice)}</span>
                    </div>
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

      {/* Recent Decisions */}
      <div>
        <h3 className="text-xl font-bold mb-6 text-gold">Recent Decisions</h3>
        {decisionsLoading ? (
          <div className="space-y-4">
            <SkeletonDecision />
            <SkeletonDecision />
            <SkeletonDecision />
          </div>
        ) : decisions && decisions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {decisions.map((decision) => (
              <DecisionCard key={decision.id} decision={decision} />
            ))}
          </div>
        ) : (
          <div className="bg-dark-card rounded-xl p-8 border border-dark-border text-center text-gray-400">
            No decisions yet
          </div>
        )}
      </div>
    </div>
  );
}
