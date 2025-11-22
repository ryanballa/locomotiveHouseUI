import Link from "next/link";
import { useParams } from "next/navigation";

interface AppointmentsByDate {
  [date: string]: number;
}

interface ScheduledVisitsCardProps {
  appointmentsByDate: AppointmentsByDate;
  loading: boolean;
  error: string | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else {
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const monthDay = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${dayName}, ${monthDay}`;
  }
}

export function ScheduledVisitsCard({
  appointmentsByDate,
  loading,
  error,
}: ScheduledVisitsCardProps) {
  const params = useParams();
  const clubId = params.id as string;
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Scheduled Club Visits
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
          Scheduled Club Visits
        </h2>
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm font-medium text-red-800">{error}</div>
        </div>
      </div>
    );
  }

  const dates = Object.keys(appointmentsByDate).sort();
  const totalAppointments = Object.values(appointmentsByDate).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Scheduled Club Visits
      </h2>

      {totalAppointments === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No appointments scheduled for the next 7 days.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dates.map((date) => {
            const count = appointmentsByDate[date];
            const isClickable = count > 0;

            const content = (
              <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${isClickable ? "hover:bg-gray-100 cursor-pointer transition" : ""}`}>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(date)}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                  {count} {count === 1 ? "visit" : "visits"}
                </span>
              </div>
            );

            if (isClickable) {
              return (
                <Link
                  key={date}
                  href={`/club/${clubId}/appointments/${date}`}
                >
                  {content}
                </Link>
              );
            } else {
              return <div key={date}>{content}</div>;
            }
          })}
        </div>
      )}

      {totalAppointments > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              {totalAppointments}
            </span>{" "}
            total visits scheduled for the next 7 days
          </p>
        </div>
      )}
    </div>
  );
}
