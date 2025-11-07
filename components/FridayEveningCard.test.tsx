import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FridayEveningCard } from './FridayEveningCard';
import { apiClient } from '@/lib/api';
import type { Appointment, User } from '@/lib/api';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

// Mock API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    getAppointments: vi.fn(),
    getCurrentUser: vi.fn(),
    createAppointment: vi.fn(),
    getUsers: vi.fn(),
    deleteAppointment: vi.fn(),
  },
}));

// Mock config
vi.mock('@/lib/fridayEveningConfig', () => ({
  FRIDAY_EVENING_CONFIG: {
    eveningStartHour: 18,
    signupDurationMinutes: 120,
    signupStartHour: 19,
    minAttendanceForGreen: 2,
    numFridaysToShow: 4,
  },
  shouldShowFridayEvening: vi.fn(),
}));

import { useAuth } from '@clerk/nextjs';

describe('FridayEveningCard Component', () => {
  const mockGetToken = vi.fn();
  const mockCurrentUser: User = {
    id: 29,
    token: 'test-token',
    name: 'Test User',
    email: 'test@example.com',
    permission: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Clerk auth
    (useAuth as any).mockReturnValue({
      getToken: mockGetToken,
      isSignedIn: true,
      isLoaded: true,
    });

    mockGetToken.mockResolvedValue('test-jwt-token');

    // Default mock implementations
    (apiClient.getCurrentUser as any).mockResolvedValue(mockCurrentUser);
    (apiClient.getAppointments as any).mockResolvedValue([]);
    (apiClient.getUsers as any).mockResolvedValue([mockCurrentUser]);
    (apiClient.createAppointment as any).mockResolvedValue({ created: true, id: 100 });
    (apiClient.deleteAppointment as any).mockResolvedValue({ deleted: true });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should not render when user is not signed in', async () => {
    (useAuth as any).mockReturnValue({
      getToken: mockGetToken,
      isSignedIn: false,
      isLoaded: true,
    });

    const { container } = render(<FridayEveningCard clubId={1} />);

    expect(container.firstChild).toBeNull();
  });

  it('should show loading state initially', async () => {
    (apiClient.getAppointments as any).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([]), 100);
        })
    );

    render(<FridayEveningCard clubId={1} />);

    expect(screen.getByText('Loading Friday evening schedule...')).toBeInTheDocument();
  });

  it('should display 4 Friday cards', async () => {
    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      // Look for the "Friday Evenings" title
      expect(screen.getByText('Friday Evenings')).toBeInTheDocument();
      // Check that 4 cards are rendered
      const cards = document.querySelectorAll('.grid.grid-cols-1 > div');
      expect(cards.length).toBe(4);
    });
  });

  it('should show orange card when attendees < 2', async () => {
    const nextFriday = getNextFriday();
    const appointments: Appointment[] = [
      {
        id: 1,
        schedule: new Date(nextFriday.setUTCHours(18, 0, 0, 0)).toISOString(), // Friday evening
        duration: 120,
        user_id: 999, // Different user
      },
    ];

    (apiClient.getAppointments as any).mockResolvedValue(appointments);

    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/1 person/)).toBeInTheDocument();
      const cards = document.querySelectorAll('.bg-orange-50');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  it('should show green card when attendees >= 2', async () => {
    const nextFriday = getNextFriday();
    const appointments: Appointment[] = [
      {
        id: 1,
        schedule: new Date(nextFriday.setUTCHours(18, 0, 0, 0)).toISOString(), // Friday evening
        duration: 120,
        user_id: 999,
      },
      {
        id: 2,
        schedule: new Date(nextFriday.setUTCHours(20, 0, 0, 0)).toISOString(), // Same Friday
        duration: 120,
        user_id: 888,
      },
    ];

    (apiClient.getAppointments as any).mockResolvedValue(appointments);

    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/2 people/)).toBeInTheDocument();
      const cards = document.querySelectorAll('.bg-green-50');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  it('should display attendance count correctly', async () => {
    const nextFriday = getNextFriday();
    const appointments: Appointment[] = [
      {
        id: 1,
        schedule: new Date(nextFriday.setUTCHours(18, 0, 0, 0)).toISOString(),
        duration: 120,
        user_id: 999,
      },
      {
        id: 2,
        schedule: new Date(nextFriday.setUTCHours(19, 30, 0, 0)).toISOString(),
        duration: 120,
        user_id: 888,
      },
      {
        id: 3,
        schedule: new Date(nextFriday.setUTCHours(20, 0, 0, 0)).toISOString(),
        duration: 120,
        user_id: 777,
      },
    ];

    (apiClient.getAppointments as any).mockResolvedValue(appointments);

    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/3 people/)).toBeInTheDocument();
    });
  });

  it('should show signup button when user is not attending', async () => {
    const appointment: Appointment = {
      id: 1,
      schedule: '2025-10-31T18:00:00Z',
      duration: 120,
      user_id: 999, // Different user
    };

    (apiClient.getAppointments as any).mockResolvedValue([appointment]);

    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      const buttons = screen.getAllByText(/\+ Sign Up \(7-9 PM\)/);
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('should show "You\'re signed up!" when user is attending', async () => {
    const nextFriday = getNextFriday();
    const appointment: Appointment = {
      id: 1,
      schedule: new Date(nextFriday.setUTCHours(19, 0, 0, 0)).toISOString(),
      duration: 120,
      user_id: mockCurrentUser.id, // Current user
    };

    (apiClient.getAppointments as any).mockResolvedValue([appointment]);

    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/✓ You're signed up!/)).toBeInTheDocument();
    });
  });

  it('should prevent duplicate signups', async () => {
    const appointment: Appointment = {
      id: 1,
      schedule: '2025-10-31T19:00:00Z',
      duration: 120,
      user_id: mockCurrentUser.id,
    };

    (apiClient.getAppointments as any).mockResolvedValue([appointment]);

    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      const signupButtons = screen.queryAllByText(/\+ Sign Up \(7-9 PM\)/);
      // Should not have signup button for this Friday since user is already signed up
      expect(signupButtons.length).toBeLessThan(4);
    });
  });

  it('should call createAppointment with correct data when user signs up', async () => {
    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      const buttons = screen.getAllByText(/\+ Sign Up \(7-9 PM\)/);
      expect(buttons.length).toBeGreaterThan(0);
    });

    const signupButtons = screen.getAllByText(/\+ Sign Up \(7-9 PM\)/);
    fireEvent.click(signupButtons[0]);

    await waitFor(() => {
      expect(apiClient.createAppointment).toHaveBeenCalled();
    }, { timeout: 2000 });

    const call = (apiClient.createAppointment as any).mock.calls[0];
    const appointmentData = call[0];

    expect(appointmentData.duration).toBe(120); // 7-9 PM
    expect(appointmentData.user_id).toBe(mockCurrentUser.id);
    // Schedule should be on the Friday at 7 PM (19:00)
    const scheduleDate = new Date(appointmentData.schedule);
    expect(scheduleDate.getUTCHours()).toBe(19);
  });

  it('should update UI after successful signup', async () => {
    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      const buttons = screen.getAllByText(/\+ Sign Up \(7-9 PM\)/);
      expect(buttons.length).toBeGreaterThan(0);
    });

    const signupButtons = screen.getAllByText(/\+ Sign Up \(7-9 PM\)/);
    fireEvent.click(signupButtons[0]);

    // After signup, should show "You're signed up!" for that Friday
    await waitFor(() => {
      const signedUpMessages = screen.getAllByText(/✓ You're signed up!/);
      expect(signedUpMessages.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  it('should handle signup failure gracefully', async () => {
    (apiClient.createAppointment as any).mockResolvedValue({ created: false });

    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      const buttons = screen.getAllByText(/\+ Sign Up \(7-9 PM\)/);
      expect(buttons.length).toBeGreaterThan(0);
    });

    const signupButtons = screen.getAllByText(/\+ Sign Up \(7-9 PM\)/);
    fireEvent.click(signupButtons[0]);

    // Button should still be clickable after failure
    await waitFor(() => {
      const buttons = screen.getAllByText(/\+ Sign Up \(7-9 PM\)/);
      expect(buttons.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  it('should only include evening appointments (6 PM+)', async () => {
    const nextFriday = getNextFriday();
    const appointments: Appointment[] = [
      {
        id: 1,
        schedule: new Date(nextFriday.setUTCHours(14, 0, 0, 0)).toISOString(), // 2 PM - should not count
        duration: 120,
        user_id: 999,
      },
      {
        id: 2,
        schedule: new Date(nextFriday.setUTCHours(18, 0, 0, 0)).toISOString(), // 6 PM - should count
        duration: 120,
        user_id: 888,
      },
      {
        id: 3,
        schedule: new Date(nextFriday.setUTCHours(17, 59, 0, 0)).toISOString(), // 5:59 PM - should not count
        duration: 120,
        user_id: 777,
      },
    ];

    (apiClient.getAppointments as any).mockResolvedValue(appointments);

    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      // Only the 6 PM appointment should count, so should show 1 person
      expect(screen.getByText(/1 person/)).toBeInTheDocument();
    });
  });

  it('should display "Be the first to sign up!" when no one is attending', async () => {
    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      const messages = screen.getAllByText(/Be the first to sign up!/);
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  it('should display correct message when 1 more person needed', async () => {
    const nextFriday = getNextFriday();
    const appointment: Appointment = {
      id: 1,
      schedule: new Date(nextFriday.setUTCHours(18, 0, 0, 0)).toISOString(),
      duration: 120,
      user_id: 999,
    };

    (apiClient.getAppointments as any).mockResolvedValue([appointment]);

    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/Need 1 more/)).toBeInTheDocument();
    });
  });

  it('should display confirmation message when 2+ people attending', async () => {
    const nextFriday = getNextFriday();
    const appointments: Appointment[] = [
      {
        id: 1,
        schedule: new Date(nextFriday.setUTCHours(18, 0, 0, 0)).toISOString(),
        duration: 120,
        user_id: 999,
      },
      {
        id: 2,
        schedule: new Date(nextFriday.setUTCHours(20, 0, 0, 0)).toISOString(),
        duration: 120,
        user_id: 888,
      },
    ];

    (apiClient.getAppointments as any).mockResolvedValue(appointments);

    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/✓ Enough people to visit!/)).toBeInTheDocument();
    });
  });

  it('should disable signup button while signing up', async () => {
    (apiClient.createAppointment as any).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ created: true, id: 100 }), 500);
        })
    );

    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      const buttons = screen.getAllByText(/\+ Sign Up \(7-9 PM\)/);
      expect(buttons.length).toBeGreaterThan(0);
    });

    const signupButtons = screen.getAllByText(/\+ Sign Up \(7-9 PM\)/);
    fireEvent.click(signupButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Signing up.../)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should fetch appointments and user data on mount', async () => {
    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      expect(apiClient.getCurrentUser).toHaveBeenCalledWith('test-jwt-token');
      expect(apiClient.getAppointments).toHaveBeenCalledWith('test-jwt-token');
    });
  });

  it('should handle missing current user gracefully', async () => {
    (apiClient.getCurrentUser as any).mockResolvedValue(null);

    render(<FridayEveningCard clubId={1} />);

    await waitFor(() => {
      // Component should still render with empty attendance
      expect(screen.getByText(/Friday/)).toBeInTheDocument();
    });
  });
});

/**
 * Helper function to get the next Friday from today
 */
function getNextFriday(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let current = new Date(today);
  const dayOfWeek = current.getUTCDay();
  const daysUntilFriday = dayOfWeek === 5 ? 0 : (5 - dayOfWeek + 7) % 7;

  current.setUTCDate(current.getUTCDate() + daysUntilFriday);
  return current;
}
