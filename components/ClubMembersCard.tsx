interface ClubMembersCardProps {
  memberCount: number;
  loading: boolean;
  error: string | null;
}

export function ClubMembersCard({
  memberCount,
  loading,
  error,
}: ClubMembersCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Club Members
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
          Club Members
        </h2>
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm font-medium text-red-800">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Club Members
      </h2>
      <div className="text-center py-8">
        <div className="text-5xl font-bold text-blue-600 mb-2">
          {memberCount}
        </div>
        <p className="text-gray-600">
          {memberCount === 1 ? "member" : "members"} signed up
        </p>
      </div>
    </div>
  );
}
