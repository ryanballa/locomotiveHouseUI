'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useState } from 'react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useClubCheck } from '@/hooks/useClubCheck';

export function Navbar() {
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isAppointmentsDropdownOpen, setIsAppointmentsDropdownOpen] = useState(false);
  const { isAdmin, loading } = useAdminCheck();
  const { clubId, loading: clubLoading } = useClubCheck();

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold">
              Locomotive House
            </Link>
            <div className="hidden md:flex space-x-4">
              <SignedIn>
                {/* Appointments Dropdown */}
                <div className="relative group">
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
                <Link
                  href="/addresses"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"
                >
                  Addresses
                </Link>

                {/* Admin Dropdown - Only visible to admin users */}
                {!loading && isAdmin && (
                  <div className="relative group">
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

                    {/* Dropdown Menu */}
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
          </div>
          <div className="flex items-center">
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
      </div>
    </nav>
  );
}
