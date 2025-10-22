interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  prefix?: string;
  suffix?: string;
}

export default function StatCard({ label, value, icon, change, prefix = '', suffix = '' }: StatCardProps) {
  const changeColor = change !== undefined && change > 0 ? 'text-profit' : change !== undefined && change < 0 ? 'text-loss' : 'text-gray-400';
  const changeSign = change !== undefined && change > 0 ? '+' : '';

  return (
    <div className="bg-dark-card rounded-xl p-6 border border-dark-border hover:border-gold/30 transition-all duration-300 shadow-lg hover:shadow-gold/10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className="text-gold text-3xl">{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold text-white mb-1">
            {prefix}{value}{suffix}
          </div>
          {change !== undefined && (
            <div className={`text-sm font-medium ${changeColor}`}>
              {changeSign}{change.toFixed(2)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
