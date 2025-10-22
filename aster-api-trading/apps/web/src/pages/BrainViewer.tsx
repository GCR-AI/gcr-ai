import { useState } from 'react';
import { format } from 'date-fns';
import { useLatest } from '../hooks/useData';
import { formatNumber, formatCurrency } from '../utils/format';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';
import { BiMinus } from 'react-icons/bi';
import { RiTyphoonFill, RiBrainFill } from 'react-icons/ri';
import { FaFileAlt, FaRobot } from 'react-icons/fa';
import { BsLightbulb } from 'react-icons/bs';

export default function BrainViewer() {
  const { data: latest, isLoading } = useLatest();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-dark-bg rounded-xl p-8 border border-gold/20 shadow-2xl shadow-gold/5 animate-pulse">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-dark-border rounded-xl"></div>
            <div>
              <div className="h-8 bg-dark-border rounded w-48 mb-2"></div>
              <div className="h-4 bg-dark-border rounded w-32"></div>
            </div>
          </div>
          <div className="h-12 w-32 bg-dark-border rounded-xl"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-dark-bg rounded-xl p-4 border border-dark-border">
              <div className="h-3 bg-dark-border rounded w-16 mb-2"></div>
              <div className="h-6 bg-dark-border rounded w-20"></div>
            </div>
          ))}
        </div>
        <div className="bg-dark-bg rounded-xl p-6 border border-dark-border">
          <div className="h-4 bg-dark-border rounded w-24 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-dark-border rounded w-full"></div>
            <div className="h-3 bg-dark-border rounded w-5/6"></div>
            <div className="h-3 bg-dark-border rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="bg-dark-card rounded-xl p-8 border border-dark-border text-center text-gray-400">
        No decisions yet. Waiting for Claude to make first decision...
      </div>
    );
  }

  const vibeIcon: Record<string, React.ReactNode> = {
    bullish: <HiTrendingUp className="text-profit" />,
    bearish: <HiTrendingDown className="text-loss" />,
    neutral: <BiMinus className="text-gray-400" />,
    chaos: <RiTyphoonFill className="text-yellow-500" />,
  };

  return (
    <div className="space-y-6">
      {/* Main Decision Card */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-dark-bg rounded-xl p-8 border border-gold/20 shadow-2xl shadow-gold/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center shadow-lg">
              <RiBrainFill className="text-4xl text-dark-bg" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gold">Claude's Brain</h2>
              <p className="text-gray-400 text-sm mt-1">
                {format(new Date(latest.timestamp), 'MMM dd, yyyy HH:mm:ss')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-dark-bg px-4 py-3 rounded-xl border border-dark-border">
            <span className="text-4xl">{vibeIcon[latest.vibe]}</span>
            <span className="text-sm text-gold font-semibold uppercase">{latest.vibe}</span>
          </div>
        </div>

        {/* Decision Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-dark-bg rounded-xl p-4 border border-dark-border">
            <div className="text-gray-400 text-xs mb-2">Symbol</div>
            <div className="font-bold text-xl text-white">{latest.symbol}</div>
          </div>
          <div className="bg-dark-bg rounded-xl p-4 border border-dark-border">
            <div className="text-gray-400 text-xs mb-2">Action</div>
            <div className={`font-bold text-xl ${
              latest.action === 'BUY' ? 'text-profit' :
              latest.action === 'SELL' ? 'text-loss' :
              'text-gold'
            }`}>
              {latest.action}
            </div>
          </div>
          <div className="bg-dark-bg rounded-xl p-4 border border-dark-border">
            <div className="text-gray-400 text-xs mb-2">Confidence</div>
            <div className="font-bold text-xl text-gold">{Math.round(latest.confidence * 100)}%</div>
          </div>
          <div className="bg-dark-bg rounded-xl p-4 border border-dark-border">
            <div className="text-gray-400 text-xs mb-2">Risk Level</div>
            <div className={`font-bold text-xl capitalize ${
              latest.riskLevel === 'high' ? 'text-loss' :
              latest.riskLevel === 'medium' ? 'text-yellow-500' :
              'text-profit'
            }`}>
              {latest.riskLevel}
            </div>
          </div>
        </div>

        {/* Reasoning */}
        <div className="bg-dark-bg rounded-xl p-6 mb-6 border border-dark-border">
          <h3 className="text-sm font-bold text-gold mb-4 uppercase tracking-wider flex items-center gap-2">
            <BsLightbulb /> Reasoning
          </h3>
          <p className="text-gray-200 leading-relaxed">{latest.reasoning}</p>
        </div>

        {/* Trade Details */}
        {(latest.stopLoss || latest.takeProfit) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-bg rounded-xl p-5 border border-dark-border">
              <div className="text-gray-400 text-xs mb-2">Entry Price</div>
              <div className="font-bold text-2xl text-gold-light">${formatNumber(latest.price)}</div>
            </div>
            {latest.stopLoss && (
              <div className="bg-dark-bg rounded-xl p-5 border border-dark-border">
                <div className="text-gray-400 text-xs mb-2">Stop Loss</div>
                <div className="font-bold text-2xl text-loss">${formatNumber(latest.stopLoss)}</div>
              </div>
            )}
            {latest.takeProfit && (
              <div className="bg-dark-bg rounded-xl p-5 border border-dark-border">
                <div className="text-gray-400 text-xs mb-2">Take Profit</div>
                <div className="font-bold text-2xl text-profit">${formatNumber(latest.takeProfit)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prompt Inspector */}
      <div className="bg-dark-card rounded-xl border border-dark-border shadow-lg overflow-hidden">
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-dark-hover transition-all"
        >
          <span className="font-bold text-gold text-lg flex items-center gap-2">
            <FaFileAlt /> Prompt Sent to Claude
          </span>
          <span className="text-gold text-xl">{showPrompt ? '▲' : '▼'}</span>
        </button>
        {showPrompt && (
          <div className="px-6 pb-6 border-t border-dark-border">
            <pre className="bg-dark-bg rounded-xl p-5 text-xs text-gray-300 overflow-auto max-h-96 mt-4 border border-dark-border font-mono">
              {latest.prompt}
            </pre>
          </div>
        )}
      </div>

      {/* Response Inspector */}
      <div className="bg-dark-card rounded-xl border border-dark-border shadow-lg overflow-hidden">
        <button
          onClick={() => setShowResponse(!showResponse)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-dark-hover transition-all"
        >
          <span className="font-bold text-gold text-lg flex items-center gap-2">
            <FaRobot /> Claude's Raw Response
          </span>
          <span className="text-gold text-xl">{showResponse ? '▲' : '▼'}</span>
        </button>
        {showResponse && (
          <div className="px-6 pb-6 border-t border-dark-border">
            <pre className="bg-dark-bg rounded-xl p-5 text-xs text-gray-300 overflow-auto max-h-96 mt-4 border border-dark-border font-mono">
              {latest.llmResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
