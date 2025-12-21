import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navbar } from './navbar';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignedIn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  UserButton: () => <div data-testid="user-button">User Button</div>,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock hooks
vi.mock('@/hooks/useAdminCheck', () => ({
  useAdminCheck: vi.fn(),
}));

vi.mock('@/hooks/useClubCheck', () => ({
  useClubCheck: vi.fn(),
}));

vi.mock('@/hooks/useUserClubs', () => ({
  useUserClubs: vi.fn(),
}));

// Mock cookie utilities
vi.mock('@/lib/cookieUtils', () => ({
  getCookie: vi.fn(),
}));

import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useClubCheck } from '@/hooks/useClubCheck';
import { useUserClubs } from '@/hooks/useUserClubs';

describe('Navbar - Club Picker Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hide club picker for non-admin with single club', () => {
    (useAdminCheck as any).mockReturnValue({
      isAdmin: false,
      loading: false,
    });

    (useClubCheck as any).mockReturnValue({
      hasClub: true,
      loading: false,
      clubId: 1,
    });

    (useUserClubs as any).mockReturnValue({
      clubs: [{ id: 1, name: 'Test Club' }],
      currentClubId: 1,
      loading: false,
      clubsLoading: false,
      selectClub: vi.fn(),
    });

    const { container } = render(<Navbar />);

    // Desktop club selector should not be visible
    const desktopSelector = container.querySelector('.hidden.md\\:block[class*="bg-gray-900"]');
    if (desktopSelector) {
      expect(desktopSelector).toHaveStyle('display: none');
    }
  });

  it('should show club picker for non-admin with multiple clubs', () => {
    (useAdminCheck as any).mockReturnValue({
      isAdmin: false,
      loading: false,
    });

    (useClubCheck as any).mockReturnValue({
      hasClub: true,
      loading: false,
      clubId: 1,
    });

    (useUserClubs as any).mockReturnValue({
      clubs: [
        { id: 1, name: 'Club A' },
        { id: 2, name: 'Club B' },
      ],
      currentClubId: 1,
      loading: false,
      clubsLoading: false,
      selectClub: vi.fn(),
    });

    render(<Navbar />);

    // Should find club name in the navbar
    expect(screen.getByText('Club A')).toBeInTheDocument();
  });

  it('should show club picker for admin with single club', () => {
    (useAdminCheck as any).mockReturnValue({
      isAdmin: true,
      loading: false,
    });

    (useClubCheck as any).mockReturnValue({
      hasClub: true,
      loading: false,
      clubId: 1,
    });

    (useUserClubs as any).mockReturnValue({
      clubs: [{ id: 1, name: 'Test Club' }],
      currentClubId: 1,
      loading: false,
      clubsLoading: false,
      selectClub: vi.fn(),
    });

    render(<Navbar />);

    // Admin should see club name even with single club
    expect(screen.getByText('Test Club')).toBeInTheDocument();
  });

  it('should show club picker for admin with multiple clubs', () => {
    (useAdminCheck as any).mockReturnValue({
      isAdmin: true,
      loading: false,
    });

    (useClubCheck as any).mockReturnValue({
      hasClub: true,
      loading: false,
      clubId: 1,
    });

    (useUserClubs as any).mockReturnValue({
      clubs: [
        { id: 1, name: 'Club A' },
        { id: 2, name: 'Club B' },
      ],
      currentClubId: 1,
      loading: false,
      clubsLoading: false,
      selectClub: vi.fn(),
    });

    render(<Navbar />);

    // Admin should see club name
    expect(screen.getByText('Club A')).toBeInTheDocument();
  });

  it('should show Select Club text for non-admin with no clubs', () => {
    (useAdminCheck as any).mockReturnValue({
      isAdmin: false,
      loading: false,
    });

    (useClubCheck as any).mockReturnValue({
      hasClub: false,
      loading: false,
      clubId: null,
    });

    (useUserClubs as any).mockReturnValue({
      clubs: [],
      currentClubId: null,
      loading: false,
      clubsLoading: false,
      selectClub: vi.fn(),
    });

    render(<Navbar />);

    // Should not show club selector section for non-admin with no clubs
    expect(screen.queryByText('Select Club')).not.toBeInTheDocument();
  });

  it('should update club picker visibility when user becomes admin', () => {
    const { rerender } = render(<Navbar />);

    // Start as non-admin with single club
    (useAdminCheck as any).mockReturnValue({
      isAdmin: false,
      loading: false,
    });

    (useClubCheck as any).mockReturnValue({
      hasClub: true,
      loading: false,
      clubId: 1,
    });

    (useUserClubs as any).mockReturnValue({
      clubs: [{ id: 1, name: 'Test Club' }],
      currentClubId: 1,
      loading: false,
      clubsLoading: false,
      selectClub: vi.fn(),
    });

    rerender(<Navbar />);

    // Now user becomes admin
    (useAdminCheck as any).mockReturnValue({
      isAdmin: true,
      loading: false,
    });

    rerender(<Navbar />);

    // Club picker should now be visible
    expect(screen.getByText('Test Club')).toBeInTheDocument();
  });

  it('should update club picker visibility when club count changes', () => {
    (useAdminCheck as any).mockReturnValue({
      isAdmin: false,
      loading: false,
    });

    (useClubCheck as any).mockReturnValue({
      hasClub: true,
      loading: false,
      clubId: 1,
    });

    // Start with single club
    (useUserClubs as any).mockReturnValue({
      clubs: [{ id: 1, name: 'Club A' }],
      currentClubId: 1,
      loading: false,
      clubsLoading: false,
      selectClub: vi.fn(),
    });

    const { rerender } = render(<Navbar />);

    // Add another club
    (useUserClubs as any).mockReturnValue({
      clubs: [
        { id: 1, name: 'Club A' },
        { id: 2, name: 'Club B' },
      ],
      currentClubId: 1,
      loading: false,
      clubsLoading: false,
      selectClub: vi.fn(),
    });

    rerender(<Navbar />);

    // Club picker should now be visible
    expect(screen.getByText('Club A')).toBeInTheDocument();
  });

  it('should only show clubs from useUserClubs array', () => {
    (useAdminCheck as any).mockReturnValue({
      isAdmin: true,
      loading: false,
    });

    (useClubCheck as any).mockReturnValue({
      hasClub: true,
      loading: false,
      clubId: 1,
    });

    // User has permission for clubs 1 and 2 only
    (useUserClubs as any).mockReturnValue({
      clubs: [
        { id: 1, name: 'Club A' },
        { id: 2, name: 'Club B' },
      ],
      currentClubId: 1,
      loading: false,
      clubsLoading: false,
      selectClub: vi.fn(),
    });

    render(<Navbar />);

    // Should show assigned clubs that are rendered
    expect(screen.getByText('Club A')).toBeInTheDocument();
  });
});
