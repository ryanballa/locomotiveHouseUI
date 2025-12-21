import { Address } from "@/lib/api";

interface RecentAddressesCardProps {
  addresses: Address[];
  loading: boolean;
  error: string | null;
}

export function RecentAddressesCard({
  addresses,
  loading,
  error,
}: RecentAddressesCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Addresses
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
          Recent Addresses
        </h2>
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm font-medium text-red-800">{error}</div>
        </div>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Addresses
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500">No addresses found for this club.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Addresses ({addresses.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Number
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Description
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {addresses.map((address) => (
              <tr
                key={address.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-4 font-medium text-gray-900">
                  {address.number}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {address.description || "-"}
                </td>
                <td className="py-3 px-4">
                  {address.in_use ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      In Use
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Available
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
