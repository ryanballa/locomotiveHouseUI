import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserClubs } from './useUserClubs';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api';
import * as cookieUtils from '@/lib/cookieUtils';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

// Mock API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    getClubs: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock cookie utilities
vi.mock('@/lib/cookieUtils', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}));

// Mock useLocalStorage
vi.mock('@/hooks/useLocalStorage', () => ({
  default: vi.fn(() => [[], vi.fn()]),
}));

describe('useUserClubs Hook', () => {
  const mockGetToken = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockResolvedValue('test-token');
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should filter clubs to only include user assigned clubs', async () => {
    (useAuth as any).mockReturnValue({
      getToken: mockGetToken,
      isSignedIn: true,
      isLoaded: true,
    });

    // All available clubs in system
    const allClubs = [
      { id: 1, name: 'Club A' },
      { id: 2, name: 'Club B' },
      { id: 3, name: 'Club C' },
      { id: 4, name: 'Club D' },
    ];

    // User is only assigned to clubs 1 and 3
    const currentUser = {
      id: 100,
      name: 'Test User',
      email: 'test@example.com',
      permission: 2,
      clubs: [
        { user_id: 100, club_id: 1 },
        { user_id: 100, club_id: 3 },
      ],
    };

    (apiClient.getClubs as any).mockResolvedValue(allClubs);
    (apiClient.getCurrentUser as any).mockResolvedValue(currentUser);
    (cookieUtils.getCookie as any).mockReturnValue(null);

    const { result } = renderHook(() => useUserClubs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only return clubs 1 and 3
    expect(result.current.clubs).toHaveLength(2);
    expect(result.current.clubs).toContainEqual({ id: 1, name: 'Club A' });
    expect(result.current.clubs).toContainEqual({ id: 3, name: 'Club C' });

    // Should NOT include clubs 2 and 4
    expect(result.current.clubs).not.toContainEqual({ id: 2, name: 'Club B' });
    expect(result.current.clubs).not.toContainEqual({ id: 4, name: 'Club D' });
  });

  it('should set primary club from user data', async () => {
    (useAuth as any).mockReturnValue({
      getToken: mockGetToken,
      isSignedIn: true,
      isLoaded: true,
    });

    const allClubs = [
      { id: 1, name: 'Club A' },
      { id: 2, name: 'Club B' },
    ];

    const currentUser = {
      id: 100,
      name: 'Test User',
      email: 'test@example.com',
      permission: 2,
      clubs: [
        { user_id: 100, club_id: 2 }, // Primary club
        { user_id: 100, club_id: 1 },
      ],
    };

    (apiClient.getClubs as any).mockResolvedValue(allClubs);
    (apiClient.getCurrentUser as any).mockResolvedValue(currentUser);
    (cookieUtils.getCookie as any).mockReturnValue(null);

    const { result } = renderHook(() => useUserClubs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should set current club to primary club (2)
    expect(result.current.currentClubId).toBe(2);
  });

  it('should prefer saved club ID over primary club if user has access', async () => {
    (useAuth as any).mockReturnValue({
      getToken: mockGetToken,
      isSignedIn: true,
      isLoaded: true,
    });

    const allClubs = [
      { id: 1, name: 'Club A' },
      { id: 2, name: 'Club B' },
    ];

    const currentUser = {
      id: 100,
      name: 'Test User',
      email: 'test@example.com',
      permission: 2,
      clubs: [
        { user_id: 100, club_id: 2 }, // Primary club
        { user_id: 100, club_id: 1 },
      ],
    };

    (apiClient.getClubs as any).mockResolvedValue(allClubs);
    (apiClient.getCurrentUser as any).mockResolvedValue(currentUser);
    (cookieUtils.getCookie as any).mockReturnValue('1'); // User previously selected club 1

    const { result } = renderHook(() => useUserClubs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should use saved club ID (1) since user has access
    expect(result.current.currentClubId).toBe(1);
  });

  it('should not include clubs in list that user does not have permission to access', async () => {
    (useAuth as any).mockReturnValue({
      getToken: mockGetToken,
      isSignedIn: true,
      isLoaded: true,
    });

    const allClubs = [
      { id: 1, name: 'Club A' },
      { id: 2, name: 'Club B' },
      { id: 3, name: 'Club C' },
    ];

    const currentUser = {
      id: 100,
      name: 'Test User',
      email: 'test@example.com',
      permission: 2,
      clubs: [
        { user_id: 100, club_id: 1 },
        { user_id: 100, club_id: 2 },
        // Note: no permission for club 3
      ],
    };

    (apiClient.getClubs as any).mockResolvedValue(allClubs);
    (apiClient.getCurrentUser as any).mockResolvedValue(currentUser);
    (cookieUtils.getCookie as any).mockReturnValue(null);

    const { result } = renderHook(() => useUserClubs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only include clubs 1 and 2
    expect(result.current.clubs).toHaveLength(2);
    expect(result.current.clubs).toEqual([
      { id: 1, name: 'Club A' },
      { id: 2, name: 'Club B' },
    ]);
  });

  it('should not return clubs for unsigned users', async () => {
    (useAuth as any).mockReturnValue({
      getToken: mockGetToken,
      isSignedIn: false,
      isLoaded: true,
    });

    const { result } = renderHook(() => useUserClubs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.clubs).toHaveLength(0);
    expect(result.current.currentClubId).toBeNull();
  });

  it('should return empty clubs if user has no token', async () => {
    (useAuth as any).mockReturnValue({
      getToken: mockGetToken,
      isSignedIn: true,
      isLoaded: true,
    });

    mockGetToken.mockResolvedValue(null);

    const { result } = renderHook(() => useUserClubs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.clubs).toHaveLength(0);
    expect(result.current.currentClubId).toBeNull();
  });

  it('should handle users with no club assignments', async () => {
    (useAuth as any).mockReturnValue({
      getToken: mockGetToken,
      isSignedIn: true,
      isLoaded: true,
    });

    const allClubs = [
      { id: 1, name: 'Club A' },
      { id: 2, name: 'Club B' },
    ];

    const currentUser = {
      id: 100,
      name: 'Test User',
      email: 'test@example.com',
      permission: 2,
      clubs: [], // No club assignments
    };

    (apiClient.getClubs as any).mockResolvedValue(allClubs);
    (apiClient.getCurrentUser as any).mockResolvedValue(currentUser);
    (cookieUtils.getCookie as any).mockReturnValue(null);

    const { result } = renderHook(() => useUserClubs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should return empty clubs array
    expect(result.current.clubs).toHaveLength(0);
    expect(result.current.currentClubId).toBeNull();
  });
});
