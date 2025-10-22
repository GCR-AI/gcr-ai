import { format } from 'date-fns';
import type { Decision } from '../types';
import { formatNumber, formatCurrency } from '../utils/format';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';
import { BiMinus } from 'react-icons/bi';
import { RiTyphoonFill } from 'react-icons/ri';
import { IoCheckmarkCircle, IoPlaySkipForward } from 'react-icons/io5';

interface DecisionCardProps {
  decision: Decision;
  onClick?: () => void;
}

const vibeIcon: Record<string, React.ReactNode> = {
  bullish: <HiTrendingUp className="text-profit" />,
  bearish: <HiTrendingDown className="text-loss" />,
  neutral: <BiMinus className="text-gray-400" />,
  chaos: <RiTyphoonFill className="text-yellow-500" />,
};

const actionColor: Record<string, string> = {
  BUY: 'bg-profit/20 text-profit border-profit/40',
  SELL: 'bg-loss/20 text-loss border-loss/40',
  HOLD: 'bg-gold/20 text-gold border-gold/40',
  CLOSE: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
};

export default function DecisionCard({ decision, onClick }: DecisionCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-dark-card rounded-xl p-5 border border-dark-border hover:border-gold/30 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-gold/10"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${actionColor[decision.action]}`}>
            {decision.action}
          </span>
          <span className="text-sm font-semibold text-white">{decision.symbol}</span>
          <span className="text-xs text-gray-500">
            {format(new Date(decision.timestamp), 'HH:mm:ss')}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{vibeIcon[decision.vibe]}</span>
          <span className="text-xs text-gold font-semibold">{Math.round(decision.confidence * 100)}%</span>
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-3 whitespace-pre-wrap leading-relaxed">
        {decision.reasoning}
      </p>

      <div className="flex items-center justify-between text-xs pt-3 border-t border-dark-border">
        <span className="text-gold-light font-semibold">
          ${formatNumber(decision.price)}
        </span>
        {decision.executed ? (
          <span className="text-profit font-semibold flex items-center gap-1">
            <IoCheckmarkCircle /> Executed
          </span>
        ) : (
          <span className="text-gray-500 flex items-center gap-1">
            <IoPlaySkipForward /> Skipped
          </span>
        )}
      </div>
    </div>
  );
}
