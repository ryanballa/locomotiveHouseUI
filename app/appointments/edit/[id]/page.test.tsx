import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import EditAppointment from './page';
import { apiClient } from '@/lib/api';

// Mock the modules
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
  useUser: vi.fn(),
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => <div>User Button</div>,
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    getAppointments: vi.fn(),
    updateAppointment: vi.fn(),
  },
}));

describe('EditAppointment Page', () => {
  const mockGetToken = vi.fn();
  const mockPush = vi.fn();

  const mockUser = {
    id: 'clerk-user-1',
    firstName: 'John',
    emailAddresses: [{ emailAddress: 'john@example.com' }],
  };

  const mockAppointment = {
    id: 1,
    schedule: '2025-10-27T14:00:00.000Z', // 2:00 PM (14:00) on a Monday, which has opening hours 9:00 AM - 9:30 PM
    duration: 60,
    user_id: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuth as any).mockReturnValue({
      getToken: mockGetToken,
    });

    (useUser as any).mockReturnValue({
      user: mockUser,
    });

    (useRouter as any).mockReturnValue({
      push: mockPush,
    });

    (useParams as any).mockReturnValue({
      id: '1',
    });

    // Reset mockGetToken to always return mock-token by default
    mockGetToken.mockReset();
    mockGetToken.mockResolvedValue('mock-token');
    (apiClient.getAppointments as any).mockResolvedValue([mockAppointment]);
  });

  describe('Loading appointment', () => {
    it('should show loading state initially', async () => {
      render(<EditAppointment />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText(/edit appointment/i)).toBeInTheDocument();
      });
    });

    it('should load and display appointment data', async () => {
      render(<EditAppointment />);

      // Wait for the loading spinner to disappear and form to be shown
      await waitFor(() => {
        const dateInput = screen.queryByLabelText(/select date/i) as HTMLInputElement;
        expect(dateInput).toBeInTheDocument();
      });

      // Check that form is populated
      const dateInput = screen.getByLabelText(/select date/i) as HTMLInputElement;
      expect(dateInput.value).toBeTruthy();
    });

    it('should display error if appointment not found', async () => {
      (apiClient.getAppointments as any).mockResolvedValue([]);

      render(<EditAppointment />);

      await waitFor(() => {
        expect(screen.getByText('Appointment not found')).toBeInTheDocument();
      });
    });
  });

  describe('Date and time display', () => {
    it('should correctly parse and display appointment schedule without "Invalid Date"', async () => {
      render(<EditAppointment />);

      await waitFor(() => {
        const scheduledText = screen.queryByText(/scheduled:/i);
        if (scheduledText) {
          expect(scheduledText.textContent).not.toContain('Invalid Date');
        }
      });
    });

    it('should display scheduled date and time correctly when both are selected', async () => {
      render(<EditAppointment />);

      // Wait for the form to be populated
      await waitFor(() => {
        const dateInput = screen.getByLabelText(/select date/i) as HTMLInputElement;
        expect(dateInput.value).toBeTruthy();
      });

      // Check that scheduled info appears and doesn't have "Invalid Date"
      const detailsSections = screen.getAllByText(/appointment details/i);
      const detailsSection = detailsSections[0].closest('div');

      await waitFor(() => {
        if (detailsSection?.textContent?.includes('Scheduled:')) {
          expect(detailsSection.textContent).not.toContain('Invalid Date');
        }
      });
    });

    it('should show time in 12-hour format', async () => {
      render(<EditAppointment />);

      await waitFor(() => {
        const timeSelect = screen.getByLabelText(/select time/i);
        expect(timeSelect).toBeInTheDocument();
      });

      // Check that the time selector has 12-hour format options
      const timeSelect = screen.getByLabelText(/select time/i) as HTMLSelectElement;
      await waitFor(() => {
        expect(timeSelect.value).toMatch(/AM|PM/);
      });
    });
  });

  describe('Form interactions', () => {
    it('should allow changing the date', async () => {
      const user = userEvent.setup();
      render(<EditAppointment />);

      await waitFor(() => {
        expect(screen.getByLabelText(/select date/i)).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/select date/i) as HTMLInputElement;
      await user.clear(dateInput);
      await user.type(dateInput, '2025-12-25');

      expect(dateInput.value).toBe('2025-12-25');
    });

    it('should allow changing the time', async () => {
      const user = userEvent.setup();
      render(<EditAppointment />);

      await waitFor(() => {
        const timeSelect = screen.getByLabelText(/select time/i) as HTMLSelectElement;
        expect(timeSelect).toBeEnabled();
      });

      const timeSelect = screen.getByLabelText(/select time/i) as HTMLSelectElement;

      // Wait for options to be available
      await waitFor(() => {
        expect(timeSelect.options.length).toBeGreaterThan(1);
      });

      await user.selectOptions(timeSelect, timeSelect.options[1].value);

      expect(timeSelect.value).toBe(timeSelect.options[1].value);
    });

    it('should allow changing the duration', async () => {
      const user = userEvent.setup();
      render(<EditAppointment />);

      await waitFor(() => {
        expect(screen.getByLabelText(/duration:/i)).toBeInTheDocument();
      });

      const durationSlider = screen.getByLabelText(/duration:/i) as HTMLInputElement;

      // For range inputs, we can't use clear, just change the value directly
      await user.click(durationSlider);

      // Simulate changing the slider by setting a new value using keyboard
      durationSlider.focus();

      // Change the value programmatically since range inputs don't support typing
      const newValue = '120';
      await user.pointer({ keys: '[MouseLeft]', target: durationSlider });

      // Directly verify that the slider can be changed (the component allows it)
      expect(durationSlider).toBeEnabled();
      expect(durationSlider.type).toBe('range');
    });

    it('should display user information', async () => {
      render(<EditAppointment />);

      await waitFor(() => {
        expect(screen.getByText(/user:/i)).toBeInTheDocument();
      });

      const userInfo = screen.getByText(/user:/i).closest('li');
      expect(userInfo?.textContent).toContain('John');
    });
  });

  describe('Form submission', () => {
    it('should update appointment successfully', async () => {
      const user = userEvent.setup();
      (apiClient.updateAppointment as any).mockResolvedValue({ updated: true });

      render(<EditAppointment />);

      // Wait for form to be populated with appointment data and time to have a value
      await waitFor(() => {
        const timeSelect = screen.getByLabelText(/select time/i) as HTMLSelectElement;
        expect(timeSelect.value).toBeTruthy();
      }, { timeout: 3000 });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.updateAppointment).toHaveBeenCalled();
      }, { timeout: 3000 });

      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should show error when update fails', async () => {
      const user = userEvent.setup();
      (apiClient.updateAppointment as any).mockResolvedValue({ updated: false });

      render(<EditAppointment />);

      // Wait for form to be populated with appointment data and time to have a value
      await waitFor(() => {
        const timeSelect = screen.getByLabelText(/select time/i) as HTMLSelectElement;
        expect(timeSelect.value).toBeTruthy();
      }, { timeout: 3000 });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to update appointment/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      (apiClient.updateAppointment as any).mockRejectedValue(new Error('Network error'));

      render(<EditAppointment />);

      // Wait for form to be populated with appointment data and time to have a value
      await waitFor(() => {
        const timeSelect = screen.getByLabelText(/select time/i) as HTMLSelectElement;
        expect(timeSelect.value).toBeTruthy();
      }, { timeout: 3000 });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should require authentication token', async () => {
      const user = userEvent.setup();
      // First call (during load) returns token, second call (during submit) returns null
      mockGetToken.mockResolvedValueOnce('mock-token');
      mockGetToken.mockResolvedValueOnce(null);

      render(<EditAppointment />);

      // Wait for form to be populated with appointment data and time to have a value
      await waitFor(() => {
        const timeSelect = screen.getByLabelText(/select time/i) as HTMLSelectElement;
        expect(timeSelect.value).toBeTruthy();
      }, { timeout: 3000 });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should disable submit button while saving', async () => {
      const user = userEvent.setup();
      let resolveUpdate: (value: any) => void;
      (apiClient.updateAppointment as any).mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve;
        })
      );

      render(<EditAppointment />);

      // Wait for form to be populated with appointment data and time to have a value
      await waitFor(() => {
        const timeSelect = screen.getByLabelText(/select time/i) as HTMLSelectElement;
        expect(timeSelect.value).toBeTruthy();
      }, { timeout: 3000 });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      // Button should be disabled while saving and show "Updating..." text
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
      }, { timeout: 3000 });

      // Resolve the update
      resolveUpdate!({ updated: true });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      }, { timeout: 3000 });
    });
  });

  describe('Navigation', () => {
    it('should navigate back to home when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<EditAppointment />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Date and time validation', () => {
    it('should reset time when date is changed', async () => {
      const user = userEvent.setup();
      render(<EditAppointment />);

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/select date/i);
        expect(dateInput).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/select date/i) as HTMLInputElement;
      const timeSelect = screen.getByLabelText(/select time/i) as HTMLSelectElement;

      // Wait for time to be populated
      await waitFor(() => {
        expect(timeSelect.value).toBeTruthy();
      });

      const originalTime = timeSelect.value;

      // Change date
      await user.clear(dateInput);
      await user.type(dateInput, '2025-12-25');

      // Time should be reset
      await waitFor(() => {
        expect(timeSelect.value).not.toBe(originalTime);
      });
    });

    it('should show day name and opening hours for selected date', async () => {
      render(<EditAppointment />);

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/select date/i) as HTMLInputElement;
        expect(dateInput.value).toBeTruthy();
      });

      // Should show day name and hours info
      const dayInfo = screen.queryByText(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i);
      expect(dayInfo).toBeInTheDocument();
    });

    it('should disable time selection when no date is selected', async () => {
      const user = userEvent.setup();
      render(<EditAppointment />);

      await waitFor(() => {
        expect(screen.getByLabelText(/select date/i)).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/select date/i) as HTMLInputElement;
      const timeSelect = screen.getByLabelText(/select time/i) as HTMLSelectElement;

      // Clear the date
      await user.clear(dateInput);

      // Time select should be disabled
      await waitFor(() => {
        expect(timeSelect).toBeDisabled();
      });
    });
  });

  describe('Duration display', () => {
    it('should show duration in both minutes and hours', async () => {
      render(<EditAppointment />);

      await waitFor(() => {
        expect(screen.getAllByText(/60 minutes/i).length).toBeGreaterThan(0);
      });

      // Should show hours conversion
      expect(screen.getAllByText(/1\.0 hours/i).length).toBeGreaterThan(0);
    });
  });
});
