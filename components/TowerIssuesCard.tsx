import { Issue, Tower } from "@/lib/api";

interface IssuesByTower {
  tower: Tower;
  issues: Issue[];
}

interface TowerIssuesCardProps {
  issuesByTower: IssuesByTower[];
  loading: boolean;
  error: string | null;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  Open: { bg: "bg-blue-100", text: "text-blue-800" },
  "In Progress": { bg: "bg-yellow-100", text: "text-yellow-800" },
  Done: { bg: "bg-green-100", text: "text-green-800" },
  Closed: { bg: "bg-gray-100", text: "text-gray-800" },
};

export function TowerIssuesCard({
  issuesByTower,
  loading,
  error,
}: TowerIssuesCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Tower Issues
        </h2>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Tower Issues
        </h2>
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm font-medium text-red-800">{error}</div>
        </div>
      </div>
    );
  }

  if (issuesByTower.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Tower Issues
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500">No towers found for this club.</p>
        </div>
      </div>
    );
  }

  const totalIssues = issuesByTower.reduce(
    (sum, { issues }) => sum + issues.length,
    0
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Tower Issues ({totalIssues})
        </h2>
      </div>

      <div className="space-y-4">
        {issuesByTower.map(({ tower, issues }) => (
          <div key={tower.id} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {tower.name} ({issues.length})
            </h3>

            {issues.length === 0 ? (
              <p className="text-sm text-gray-500">No issues for this tower.</p>
            ) : (
              <div className="space-y-2">
                {issues.map((issue) => {
                  const colors = statusColors[issue.status] || statusColors.Open;
                  return (
                    <div
                      key={issue.id}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {issue.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Type: {issue.type}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${colors.bg} ${colors.text}`}
                      >
                        {issue.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
