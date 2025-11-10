"use client";

import { Issue, IssueStatus } from "@/lib/api";

interface IssueTableProps {
  /**
   * Array of issues to display
   */
  issues: Issue[];

  /**
   * Callback when Edit button is clicked
   * @param issue The issue to edit
   */
  onEdit: (issue: Issue) => void;

  /**
   * Callback when Delete button is clicked
   * @param issueId The ID of the issue to delete
   */
  onDelete: (issueId: number) => void;

  /**
   * ID of the issue currently being deleted (for loading state)
   */
  deletingIssueId?: number | null;

  /**
   * ID of the issue currently being edited (for disabled state)
   */
  editingIssueId?: number | null;

  /**
   * Optional tower name to display in header context
   */
  towerName?: string;

  /**
   * Optional club name to display in header context
   */
  clubName?: string;

  /**
   * Show tower name column (useful when displaying issues from multiple towers)
   */
  showTowerName?: boolean;

  /**
   * Show club name column (useful when displaying all issues)
   */
  showClubName?: boolean;
}

/**
 * Reusable component for displaying issues in a table format
 * Can be used to display issues from a single tower, a club, or all issues
 */
export function IssueTable({
  issues,
  onEdit,
  onDelete,
  deletingIssueId,
  editingIssueId,
  towerName,
  clubName,
  showTowerName = false,
  showClubName = false,
}: IssueTableProps) {
  if (issues.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-lg">
          No issues {clubName && `in ${clubName}`} {towerName && `for ${towerName}`}
          {!clubName && !towerName && "found"}
        </p>
      </div>
    );
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            ID
          </th>
          {showClubName && (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Club
            </th>
          )}
          {showTowerName && (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tower
            </th>
          )}
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Title
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Type
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Description
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {issues.map((issue) => (
          <tr key={issue.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {issue.id}
            </td>
            {showClubName && (
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {clubName || "-"}
              </td>
            )}
            {showTowerName && (
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {issue.tower_id}
              </td>
            )}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {issue.title}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {issue.type}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span
                className={`px-3 py-1 rounded-full text-white font-medium ${
                  issue.status === "Open"
                    ? "bg-blue-500"
                    : issue.status === "In Progress"
                    ? "bg-yellow-500"
                    : issue.status === "Done"
                    ? "bg-green-500"
                    : "bg-gray-500"
                }`}
              >
                {issue.status}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
              {issue.description || "-"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <button
                onClick={() => onEdit(issue)}
                disabled={editingIssueId !== null && editingIssueId !== issue.id}
                className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(issue.id)}
                disabled={deletingIssueId === issue.id}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingIssueId === issue.id ? "Deleting..." : "Delete"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
