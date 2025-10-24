'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useState } from 'react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useClubCheck } from '@/hooks/useClubCheck';

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
  const [isAppointmentsDropdownOpen, setIsAppointmentsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAdmin, loading } = useAdminCheck();
  const { clubId, loading: clubLoading } = useClubCheck();

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
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
                  onClick={() => setIsAppointmentsDropdownOpen(!isAppointmentsDropdownOpen)}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition flex items-center gap-1"
                >
                  Appointments
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isAppointmentsDropdownOpen ? 'rotate-180' : ''
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
                    {clubLoading ? (
                      <div className="px-4 py-2 text-sm text-gray-400">Loading...</div>
                    ) : clubId ? (
                      <>
                        <Link
                          href={`/club/${clubId}/appointments`}
                          className="block px-4 py-2 text-sm hover:bg-gray-600 transition"
                          onClick={() => setIsAppointmentsDropdownOpen(false)}
                        >
                          View Appointments
                        </Link>
                        <Link
                          href={`/club/${clubId}/appointments/create`}
                          className="block px-4 py-2 text-sm hover:bg-gray-600 transition"
                          onClick={() => setIsAppointmentsDropdownOpen(false)}
                        >
                          Create Appointment
                        </Link>
                      </>
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-400">No club assigned</div>
                    )}
                  </div>
                )}
              </div>

              {/* Addresses Link */}
              {clubId ? (
                <Link
                  href={`/club/${clubId}/addresses`}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"
                >
                  Addresses
                </Link>
              ) : null}

              {/* Admin Dropdown */}
              {!loading && isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition flex items-center gap-1"
                  >
                    Admin
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        isAdminDropdownOpen ? 'rotate-180' : ''
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
              )}
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
                    d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-700">
            <SignedIn>
              {/* Mobile Appointments Section */}
              <div className="pt-2">
                <button
                  onClick={() => setIsAppointmentsDropdownOpen(!isAppointmentsDropdownOpen)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition flex items-center gap-1"
                >
                  Appointments
                  <svg
                    className={`w-4 h-4 transition-transform ml-auto ${
                      isAppointmentsDropdownOpen ? 'rotate-180' : ''
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
                    {clubLoading ? (
                      <div className="px-4 py-2 text-sm text-gray-400">Loading...</div>
                    ) : clubId ? (
                      <>
                        <Link
                          href={`/club/${clubId}/appointments`}
                          className="block px-6 py-2 text-sm hover:bg-gray-600 transition"
                          onClick={() => {
                            setIsAppointmentsDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          View Appointments
                        </Link>
                        <Link
                          href={`/club/${clubId}/appointments/create`}
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
                      <div className="px-4 py-2 text-sm text-gray-400">No club assigned</div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Addresses Link */}
              {clubId ? (
                <Link
                  href={`/club/${clubId}/addresses`}
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Addresses
                </Link>
              ) : null}

              {/* Mobile Admin Section */}
              {!loading && isAdmin && (
                <div className="pt-2">
                  <button
                    onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition flex items-center gap-1"
                  >
                    Admin
                    <svg
                      className={`w-4 h-4 transition-transform ml-auto ${
                        isAdminDropdownOpen ? 'rotate-180' : ''
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
              )}
            </SignedIn>
          </div>
        )}
      </div>
    </nav>
  );
}
