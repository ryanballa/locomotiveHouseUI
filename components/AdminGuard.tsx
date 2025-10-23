import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navbar } from "@/components/navbar";

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * Component that wraps admin-only pages and enforces permission checks
 * Shows loading state while checking permissions
 * Shows error message if user is not an admin
 * Only renders children if user has admin permissions
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, loading, error } = useAdminCheck();

  const getErrorMessage = (): string => {
    if (!error) {
      return "You do not have permission to access this page.";
    }

    if (error.code === "UNAUTHENTICATED") {
      return "Please sign in to access this resource.";
    }

    if (error.code === "FORBIDDEN") {
      return "You do not have permission to access this resource.";
    }

    if (error.code === "USER_NOT_FOUND") {
      return "Your user account could not be found. Please try signing out and back in.";
    }

    if (error.code === "NETWORK") {
      return "Network error. Please check your connection and try again.";
    }

    return error.message || "An error occurred while checking permissions.";
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

  if (error || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {getErrorMessage()}
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
