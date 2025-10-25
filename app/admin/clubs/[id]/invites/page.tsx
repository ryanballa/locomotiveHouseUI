'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, type Club } from '@/lib/api';
import { Navbar } from '@/components/navbar';
import { AdminGuard } from '@/components/AdminGuard';
import { useAdminCheck } from '@/hooks/useAdminCheck';

interface InviteToken {
  token: string;
  expiresAt: string;
  createdAt?: string;
}

function InvitesPageContent() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const clubId = Number(params.id);

  const [club, setClub] = useState<Club | null>(null);
  const [invites, setInvites] = useState<InviteToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState('');
  const [expirationTime, setExpirationTime] = useState('09:00');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [deletingToken, setDeletingToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    if (isNaN(clubId)) {
      setError('Invalid club ID');
      setLoading(false);
      return;
    }
    fetchData();
  }, [clubId, getToken]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Fetch club details and invite tokens in parallel
      const [clubData, inviteTokens] = await Promise.all([
        apiClient.getClubById(clubId, token),
        apiClient.getClubInviteTokens(clubId, token),
      ]);

      setClub(clubData);
      setInvites(inviteTokens);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load invites';
      console.error('Error fetching invites:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expirationDate) {
      setError('Please select an expiration date');
      return;
    }

    try {
      setCreatingInvite(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Combine date and time into ISO string
      const [year, month, day] = expirationDate.split('-');
      const [hours, minutes] = expirationTime.split(':');
      const expiresAt = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );

      const result = await apiClient.createInviteToken(clubId, expiresAt, token);

      if (result.created && result.token) {
        // Clear form and refresh invites
        setExpirationDate('');
        setExpirationTime('09:00');
        await fetchData();
      } else {
        setError(result.error || 'Failed to create invite token');
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to create invite token';
      console.error('Error creating invite:', err);
      setError(errorMsg);
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleDeleteInvite = async (token: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this invite token? Users will no longer be able to join using this token.'
      )
    ) {
      return;
    }

    try {
      setDeletingToken(token);
      setError(null);
      const userToken = await getToken();
      if (!userToken) {
        setError('Authentication required');
        return;
      }

      const result = await apiClient.deleteInviteToken(clubId, token, userToken);

      if (result.deleted) {
        await fetchData();
      } else {
        setError(result.error || 'Failed to delete invite token');
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to delete invite token';
      console.error('Error deleting invite:', err);
      setError(errorMsg);
    } finally {
      setDeletingToken(null);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/club/join/${token}`
    );
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const isTokenExpired = (expiresAt: string): boolean => {
    try {
      return new Date(expiresAt) < new Date();
    } catch {
      return false;
    }
  };

  const getMinDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !club) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.push('/admin/clubs')}
            className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
          >
            <span>&larr;</span> Back to Clubs
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Club not found'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/admin/clubs/${clubId}`)}
          className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
        >
          <span>&larr;</span> Back to Club
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Manage Invites
          </h1>
          <p className="text-gray-600">Club: {club?.name}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Create Invite Form */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Create New Invite Token
            </h2>
          </div>

          <form onSubmit={handleCreateInvite} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label
                  htmlFor="expiration-date"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Expiration Date
                </label>
                <input
                  id="expiration-date"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={getMinDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="expiration-time"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Expiration Time
                </label>
                <input
                  id="expiration-time"
                  type="time"
                  value={expirationTime}
                  onChange={(e) => setExpirationTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creatingInvite || !expirationDate}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {creatingInvite ? 'Creating...' : 'Create Invite'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Invites List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Invite Tokens ({invites.length})
            </h2>
          </div>

          {invites.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">
                No invite tokens created yet. Create one above to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invites.map((invite) => {
                    const expired = isTokenExpired(invite.expiresAt);
                    return (
                      <tr
                        key={invite.token}
                        className={expired ? 'bg-gray-50' : 'hover:bg-gray-50'}
                      >
                        <td className="px-6 py-4 text-sm font-mono text-gray-900 max-w-xs truncate">
                          {invite.token}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(invite.expiresAt)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {expired ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium">
                              Expired
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {invite.createdAt
                            ? formatDate(invite.createdAt)
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleCopyToken(invite.token)}
                            className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-gray-500 inline-block"
                          >
                            {copiedToken === invite.token ? 'Copied!' : 'Copy Link'}
                          </button>
                          <button
                            onClick={() => handleDeleteInvite(invite.token)}
                            disabled={deletingToken === invite.token}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed inline-block"
                          >
                            {deletingToken === invite.token
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function InvitesPage() {
  return (
    <AdminGuard>
      <InvitesPageContent />
    </AdminGuard>
  );
}
