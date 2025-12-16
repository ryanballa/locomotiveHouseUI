"use client";

import { Club } from "@/lib/api";

interface ClubHeaderProps {
  club: Club;
}

/**
 * Displays club header with hero image, title, and description
 * Used on both public and member club pages
 */
export function ClubHeader({ club }: ClubHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
      {/* Hero Image Banner */}
      {club.hero_image && (
        <div className="relative h-48 w-full overflow-hidden bg-gray-200">
          <img
            src={club.hero_image}
            alt={`${club.name} banner`}
            className="w-full h-full object-cover object-center"
          />
        </div>
      )}

      {/* Club Info */}
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{club.name}</h1>
        {club.description && (
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {club.description}
          </p>
        )}
      </div>
    </div>
  );
}
