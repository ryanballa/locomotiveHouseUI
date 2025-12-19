"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function NewTowerReportPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const clubId = params.clubId as string;
    const towerId = params.towerId as string;

    // Build query parameters
    const queryParams = new URLSearchParams({
      towerId,
      action: "new",
    });

    // Add optional month and year parameters if provided
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (month) {
      queryParams.set("month", month);
    }

    if (year) {
      queryParams.set("year", year);
    }

    // Redirect to the reports page with query parameters to open the modal
    router.replace(`/club/${clubId}/reports?${queryParams.toString()}`);
  }, [params, router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Redirecting to reports...</div>
    </div>
  );
}
