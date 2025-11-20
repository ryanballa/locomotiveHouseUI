import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient, Address } from "@/lib/api";

interface UseClubAddressesReturn {
  addresses: Address[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch the last 10 addresses created for a specific club
 *
 * @param clubId - The ID of the club
 * @returns Object containing addresses array, loading state, and error state
 */
export function useClubAddresses(clubId: number | string): UseClubAddressesReturn {
  const { getToken, isSignedIn } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    let isActive = true;

    const fetchAddresses = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          if (isActive) {
            setError("Authentication required");
          }
          return;
        }

        const allAddresses = await apiClient.getClubAddresses(
          Number(clubId),
          token
        );

        if (isActive) {
          // Get the last 10 addresses (assuming they're in creation order)
          const recentAddresses = allAddresses.slice(-10).reverse();
          setAddresses(recentAddresses);
        }
      } catch (err) {
        if (!isActive) return;

        const errorMessage =
          err instanceof Error ? err.message : "Failed to load addresses";

        if (
          errorMessage.includes("Unauthenticated") ||
          errorMessage.includes("401")
        ) {
          setError("Please sign in to access addresses");
        } else {
          setError(errorMessage);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchAddresses();

    return () => {
      isActive = false;
    };
  }, [clubId, isSignedIn]);

  return { addresses, loading, error };
}
