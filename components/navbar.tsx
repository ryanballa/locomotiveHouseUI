"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useClubCheck } from "@/hooks/useClubCheck";
import { useUserClubs } from "@/hooks/useUserClubs";
import { useRouter, useSearchParams } from "next/navigation";
import { getCookie } from "@/lib/cookieUtils";

/**
 * Main navigation bar component for the application.
 *
 * Features:
 * - Responsive design with mobile and desktop menus
 * - Appointments dropdown with view and create options
 * - Addresses link for club-scoped address management
 * - Admin dropdown for users with admin permissions
 * - Super admins can access all features without club assignment
 *
 * @returns {JSX.Element} Rendered navigation bar
 *
 * @example
 * ```typescript
 * import { Navbar } from '@/components/navbar';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       <Navbar />
 *       <main>{children}</main>
 *     </>
 *   );
 * }
 * ```
 */
export function Navbar() {
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isAppointmentsDropdownOpen, setIsAppointmentsDropdownOpen] =
    useState(false);
  const [isClubSelectorOpen, setIsClubSelectorOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cachedClubName, setCachedClubName] = useState<string>("Select Club");
  const [isHydrated, setIsHydrated] = useState(false);

  const { isAdmin, loading } = useAdminCheck();
  const { clubId, loading: clubLoading } = useClubCheck();
  const {
    clubs,
    currentClubId,
    loading: clubsLoading,
    selectClub,
  } = useUserClubs();
  const router = useRouter();
  const searchParams = useSearchParams();
  const devModeOff = searchParams.get("devMode") === "off";

  // Load cached club name from localStorage on mount
  useEffect(() => {
    const savedClubId = getCookie("selectedClubId");
    if (savedClubId) {
      const savedClubName = localStorage.getItem("selectedClubName");
      if (savedClubName) {
        setCachedClubName(savedClubName);
      }
    }
    setIsHydrated(true);
  }, []);

  // Update cached club name when currentClubId changes
  useEffect(() => {
    if (currentClubId && clubs.length > 0) {
      const clubName = clubs.find((c) => c.id === currentClubId)?.name;
      if (clubName) {
        setCachedClubName(clubName);
        localStorage.setItem("selectedClubName", clubName);
      }
    }
  }, [currentClubId, clubs]);

  // Apply production mode class if devMode=off
  useEffect(() => {
    if (devModeOff) {
      document.body.classList.add("dev-mode-off");
    } else {
      document.body.classList.remove("dev-mode-off");
    }
  }, [devModeOff]);

  const handleClubSelect = (selectedClubId: number) => {
    selectClub(selectedClubId);
    setIsClubSelectorOpen(false);
    setIsMobileMenuOpen(false);
    // Navigate to dashboard for the selected club
    router.push(`/club/${selectedClubId}`);
  };

  const currentClubName =
    clubs.find((c) => c.id === currentClubId)?.name || cachedClubName;

  // Determine if we're in development mode and get appropriate navbar color
  const isDevelopment = process.env.NODE_ENV === "development";
  const navbarBgColor = isDevelopment
    ? "bg-[var(--navbar-bg)]"
    : "bg-gray-800";

  return (
    <nav className={`${navbarBgColor} text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold flex-shrink-0">
            Locomotive House
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <SignedIn>
              {/* Appointments Dropdown */}
              <div className="relative">
                <button
                  onClick={() =>
                    setIsAppointmentsDropdownOpen(!isAppointmentsDropdownOpen)
                  }
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition flex items-center gap-1"
                >
                  Appointments
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isAppointmentsDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>

                {/* Appointments Dropdown Menu */}
                {isAppointmentsDropdownOpen && (
                  <div className="absolute left-0 mt-0 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-50">
                    {clubsLoading ? (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        Loading...
                      </div>
                    ) : currentClubId ? (
                      <>
                        <Link
                          href={`/club/${currentClubId}/appointments`}
                          className="block px-4 py-2 text-sm hover:bg-gray-600 transition"
                          onClick={() => setIsAppointmentsDropdownOpen(false)}
                        >
                          View Appointments
                        </Link>
                        <Link
                          href={`/club/${currentClubId}/appointments/create`}
                          className="block px-4 py-2 text-sm hover:bg-gray-600 transition"
                          onClick={() => setIsAppointmentsDropdownOpen(false)}
                        >
                          Create Appointment
                        </Link>
                      </>
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        No club assigned
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Addresses Link */}
              {clubsLoading ? (
                <div className="px-3 py-2 rounded-md text-sm font-medium text-gray-400 opacity-50 cursor-wait">
                  Addresses
                </div>
              ) : currentClubId ? (
                <Link
                  href={`/club/${currentClubId}/addresses`}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"
                >
                  Addresses
                </Link>
              ) : null}

              {/* Issues Link */}
              {clubsLoading ? (
                <div className="px-3 py-2 rounded-md text-sm font-medium text-gray-400 opacity-50 cursor-wait">
                  Issues
                </div>
              ) : currentClubId ? (
                <Link
                  href={`/club/${currentClubId}/issues`}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"
                >
                  Issues
                </Link>
              ) : isAdmin ? (
                <Link
                  href="/issues"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"
                >
                  Issues
                </Link>
              ) : null}

              {/* Admin Dropdown */}
              {loading ? (
                <div className="px-3 py-2 rounded-md text-sm font-medium text-gray-400 opacity-50 cursor-wait">
                  Admin
                </div>
              ) : isAdmin ? (
                <div className="relative">
                  <button
                    onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition flex items-center gap-1"
                  >
                    Admin
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        isAdminDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </button>

                  {/* Admin Dropdown Menu */}
                  {isAdminDropdownOpen && (
                    <div className="absolute left-0 mt-0 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-50">
                      <Link
                        href="/admin/clubs"
                        className="block px-4 py-2 text-sm hover:bg-gray-600 transition"
                        onClick={() => setIsAdminDropdownOpen(false)}
                      >
                        Club Management
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <SignedIn>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md hover:bg-gray-700 transition"
                aria-label="Toggle mobile menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      isMobileMenuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </SignedIn>

            {/* Auth Buttons */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm font-medium transition">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm font-medium transition">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>

        {/* Club Selector Bar - Desktop (hidden for non-admins with only 1 club) */}
        {!clubsLoading && (isAdmin || clubs.length > 1) && (
          <div className="hidden md:block w-full bg-gray-900 border-t border-gray-700 py-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
              <SignedIn>
                <div className="relative">
                  <button
                    onClick={() => setIsClubSelectorOpen(!isClubSelectorOpen)}
                    className="px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition flex items-center gap-2 bg-gray-800"
                    title="Select a club"
                  >
                    {clubsLoading ? "Loading..." : currentClubName}
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        isClubSelectorOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </button>

                  {/* Club Selector Dropdown Menu */}
                  {isClubSelectorOpen && (
                    <div className="absolute right-0 mt-0 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-50">
                      {clubsLoading ? (
                        <div className="px-4 py-2 text-sm text-gray-400">
                          Loading clubs...
                        </div>
                      ) : clubs.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-400">
                          No clubs available
                        </div>
                      ) : (
                        clubs.map((club) => (
                          <button
                            key={club.id}
                            onClick={() => handleClubSelect(club.id)}
                            className={`block w-full text-left px-4 py-2 text-sm transition ${
                              club.id === currentClubId
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "hover:bg-gray-600"
                            }`}
                          >
                            {club.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </SignedIn>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-700">
            <SignedIn>
              {/* Mobile Appointments Section */}
              <div className="pt-2">
                <button
                  onClick={() =>
                    setIsAppointmentsDropdownOpen(!isAppointmentsDropdownOpen)
                  }
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition flex items-center gap-1"
                >
                  Appointments
                  <svg
                    className={`w-4 h-4 transition-transform ml-auto ${
                      isAppointmentsDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>

                {/* Mobile Appointments Dropdown */}
                {isAppointmentsDropdownOpen && (
                  <div className="bg-gray-700 rounded-md py-1">
                    {clubsLoading ? (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        Loading...
                      </div>
                    ) : currentClubId ? (
                      <>
                        <Link
                          href={`/club/${currentClubId}/appointments`}
                          className="block px-6 py-2 text-sm hover:bg-gray-600 transition"
                          onClick={() => {
                            setIsAppointmentsDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          View Appointments
                        </Link>
                        <Link
                          href={`/club/${currentClubId}/appointments/create`}
                          className="block px-6 py-2 text-sm hover:bg-gray-600 transition"
                          onClick={() => {
                            setIsAppointmentsDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Create Appointment
                        </Link>
                      </>
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-400">
                        No club assigned
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Club Selector (hidden for non-admins with only 1 club) */}
              {!clubsLoading && (isAdmin || clubs.length > 1) && (
                <div className="pt-2">
                  <button
                    onClick={() => setIsClubSelectorOpen(!isClubSelectorOpen)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition flex items-center gap-1"
                  >
                    {clubsLoading ? "Loading..." : currentClubName}
                    <svg
                      className={`w-4 h-4 transition-transform ml-auto ${
                        isClubSelectorOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </button>

                  {/* Mobile Club Selector Dropdown */}
                  {isClubSelectorOpen && (
                    <div className="bg-gray-700 rounded-md py-1">
                      {clubsLoading ? (
                        <div className="px-4 py-2 text-sm text-gray-400">
                          Loading clubs...
                        </div>
                      ) : clubs.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-400">
                          No clubs available
                        </div>
                      ) : (
                        clubs.map((club) => (
                          <button
                            key={club.id}
                            onClick={() => handleClubSelect(club.id)}
                            className={`block w-full text-left px-6 py-2 text-sm transition ${
                              club.id === currentClubId
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "hover:bg-gray-600"
                            }`}
                          >
                            {club.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Addresses Link */}
              {clubsLoading ? (
                <div className="block px-3 py-2 rounded-md text-sm font-medium text-gray-400 opacity-50 cursor-wait">
                  Addresses
                </div>
              ) : currentClubId ? (
                <Link
                  href={`/club/${currentClubId}/addresses`}
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Addresses
                </Link>
              ) : null}

              {/* Mobile Admin Section */}
              {loading ? (
                <div className="pt-2">
                  <div className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-400 opacity-50 cursor-wait flex items-center gap-1">
                    Admin
                  </div>
                </div>
              ) : isAdmin ? (
                <div className="pt-2">
                  <button
                    onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition flex items-center gap-1"
                  >
                    Admin
                    <svg
                      className={`w-4 h-4 transition-transform ml-auto ${
                        isAdminDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </button>

                  {/* Mobile Admin Dropdown */}
                  {isAdminDropdownOpen && (
                    <div className="bg-gray-700 rounded-md py-1">
                      <Link
                        href="/admin/clubs"
                        className="block px-6 py-2 text-sm hover:bg-gray-600 transition"
                        onClick={() => {
                          setIsAdminDropdownOpen(false);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Club Management
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </SignedIn>
          </div>
        )}
      </div>
    </nav>
  );
}
