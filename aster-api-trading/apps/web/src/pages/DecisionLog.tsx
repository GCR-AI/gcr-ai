import { useDecisions } from '../hooks/useData';
import DecisionCard from '../components/DecisionCard';
import { SkeletonDecision } from '../components/Skeleton';

export default function DecisionLog() {
  const { data: decisions, isLoading } = useDecisions(50);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-dark-card p-6 rounded-xl border border-dark-border shadow-lg">
          <div className="h-8 bg-dark-border rounded w-48 animate-pulse"></div>
          <div className="h-8 bg-dark-border rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonDecision key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-dark-card p-6 rounded-xl border border-dark-border shadow-lg">
        <h2 className="text-3xl font-bold text-gold">Decision History</h2>
        <div className="text-sm text-gray-400 bg-dark-bg px-4 py-2 rounded-lg">
          <span className="text-gold font-semibold">{decisions?.length || 0}</span> total decisions
        </div>
      </div>

      {decisions && decisions.length > 0 ? (
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
  );
}
