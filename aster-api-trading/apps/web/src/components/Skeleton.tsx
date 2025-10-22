export function SkeletonCard() {
  return (
    <div className="bg-dark-card rounded-xl p-6 border border-dark-border animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 bg-dark-border rounded w-20"></div>
        <div className="h-8 w-8 bg-dark-border rounded-full"></div>
      </div>
      <div className="h-10 bg-dark-border rounded w-32 mb-2"></div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="bg-dark-card rounded-xl p-6 border border-dark-border shadow-lg animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 bg-dark-border rounded w-16"></div>
        <div className="h-8 w-8 bg-dark-border rounded-full"></div>
      </div>
      <div className="h-10 bg-dark-border rounded w-28"></div>
    </div>
  );
}

export function SkeletonPosition() {
  return (
    <div className="bg-dark-card rounded-xl p-6 border border-dark-border shadow-lg animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 bg-dark-border rounded w-32 mb-2"></div>
          <div className="h-4 bg-dark-border rounded w-48"></div>
        </div>
        <div className="h-10 bg-dark-border rounded w-24"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-dark-bg rounded-lg p-3">
            <div className="h-3 bg-dark-border rounded w-12 mb-2"></div>
            <div className="h-5 bg-dark-border rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDecision() {
  return (
    <div className="bg-dark-card rounded-xl p-5 border border-dark-border shadow-lg animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="h-6 bg-dark-border rounded w-16"></div>
          <div className="h-4 bg-dark-border rounded w-20"></div>
          <div className="h-3 bg-dark-border rounded w-16"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-dark-border rounded-full"></div>
          <div className="h-3 bg-dark-border rounded w-10"></div>
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-dark-border rounded w-full"></div>
        <div className="h-3 bg-dark-border rounded w-5/6"></div>
        <div className="h-3 bg-dark-border rounded w-4/6"></div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-dark-border">
        <div className="h-3 bg-dark-border rounded w-20"></div>
        <div className="h-3 bg-dark-border rounded w-16"></div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-dark-bg border-b border-dark-border">
            <tr>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <th key={i} className="px-6 py-4">
                  <div className="h-3 bg-dark-border rounded w-16 animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((col) => (
                  <td key={col} className="px-6 py-4">
                    <div className="h-4 bg-dark-border rounded w-full animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
