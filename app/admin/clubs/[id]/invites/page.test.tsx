import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import InvitesPage from './page';
import { apiClient } from '@/lib/api';

// Mock the modules
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  UserButton: () => <div>User Button</div>,
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    getClubById: vi.fn(),
    getClubInviteTokens: vi.fn(),
    createInviteToken: vi.fn(),
    deleteInviteToken: vi.fn(),
  },
}));

vi.mock('@/components/AdminGuard', () => ({
  AdminGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/navbar', () => ({
  Navbar: () => <div>Navbar</div>,
}));

vi.mock('@/hooks/useAdminCheck', () => ({
  useAdminCheck: () => ({
    isAdmin: true,
    loading: false,
  }),
}));

describe('Invites Management Page', () => {
  const mockGetToken = vi.fn();
  const mockPush = vi.fn();

  const mockClub = {
    id: 1,
    name: 'Test Club',
  };

  const mockInvites = [
    {
      token: 'token-abc123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      createdAt: new Date().toISOString(),
    },
    {
      token: 'token-def456',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (expired)
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuth as any).mockReturnValue({
      getToken: mockGetToken,
    });

    (useRouter as any).mockReturnValue({
      push: mockPush,
    });

    (useParams as any).mockReturnValue({
      id: '1',
    });

    mockGetToken.mockResolvedValue('mock-token');
    (apiClient.getClubById as any).mockResolvedValue(mockClub);
    (apiClient.getClubInviteTokens as any).mockResolvedValue(mockInvites);

    // Mock window.confirm for delete
    global.confirm = vi.fn(() => true);
    // Mock navigator.clipboard for copy
    Object.defineProperty(global.navigator, 'clipboard', {
      value: {
        writeText: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  describe('Loading and Display', () => {
    it('should show loading spinner initially', () => {
      render(<InvitesPage />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should load and display club details', async () => {
      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText('Manage Invites')).toBeInTheDocument();
        expect(screen.getByText(/Club: Test Club/)).toBeInTheDocument();
      });
    });

    it('should display invite tokens', async () => {
      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText(/token-abc123/)).toBeInTheDocument();
        expect(screen.getByText(/token-def456/)).toBeInTheDocument();
      });
    });

    it('should display formatted dates in the table', async () => {
      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText(/token-abc123/)).toBeInTheDocument();
      });

      // Check that dates are displayed (should have at least 4 formatted dates: 2 tokens x 2 date columns)
      const dateCells = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(dateCells.length).toBeGreaterThanOrEqual(2); // At least 2 dates visible for the tokens
    });

    it('should display correct token count', async () => {
      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText(/Invite Tokens \(2\)/)).toBeInTheDocument();
      });
    });

    it('should show active status for non-expired tokens', async () => {
      render(<InvitesPage />);

      await waitFor(() => {
        const activeStatuses = screen.getAllByText('Active');
        expect(activeStatuses.length).toBeGreaterThan(0);
      });
    });

    it('should show expired status for expired tokens', async () => {
      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText('Expired')).toBeInTheDocument();
      });
    });

    it('should format expiration dates correctly without showing Invalid Date', async () => {
      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText(/token-abc123/)).toBeInTheDocument();
      });

      // Check that no "Invalid Date" appears in the table
      expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument();

      // Verify that dates are properly formatted (should contain month, day, year, time)
      const dateTexts = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(dateTexts.length).toBeGreaterThan(0);
    });

    it('should handle different date formats from API without showing Invalid Date', async () => {
      // Mock with date formats that might come from different backend implementations
      const problematicInvites = [
        {
          token: 'token-iso',
          expiresAt: '2025-12-25T09:00:00Z', // ISO format
          createdAt: '2025-10-25T11:00:00Z',
        },
        {
          token: 'token-timestamp',
          expiresAt: '1735118400000', // Unix timestamp (milliseconds)
          createdAt: '1729856400000',
        },
        {
          token: 'token-date-string',
          expiresAt: 'Thu Dec 25 2025 09:00:00 GMT+0000', // Date.toString() format
          createdAt: 'Fri Oct 25 2025 11:00:00 GMT+0000',
        },
        {
          token: 'token-mysql-datetime',
          expiresAt: '2025-10-31 00:00:00', // MySQL DATETIME format (from database)
          createdAt: '2025-10-25 11:00:00',
        },
      ];

      (apiClient.getClubInviteTokens as any).mockResolvedValueOnce(
        problematicInvites
      );

      render(<InvitesPage />);

      await waitFor(() => {
        // All tokens should be present
        expect(screen.getByText(/token-iso/)).toBeInTheDocument();
        expect(screen.getByText(/token-timestamp/)).toBeInTheDocument();
        expect(screen.getByText(/token-date-string/)).toBeInTheDocument();
        expect(screen.getByText(/token-mysql-datetime/)).toBeInTheDocument();
      });

      // Check that no "Invalid Date" appears anywhere in the table
      expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument();

      // Check that no "N/A" appears for dates (all should be formatted)
      const naCells = screen.queryAllByText('N/A');
      expect(naCells.length).toBe(0); // No N/A for date columns
    });

    it('should display error if there is an error and no club', async () => {
      (apiClient.getClubById as any).mockRejectedValueOnce(
        new Error('Club not found')
      );

      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText(/Club not found/)).toBeInTheDocument();
      });
    });

    it('should handle error when fetching invites', async () => {
      (apiClient.getClubInviteTokens as any).mockRejectedValue(
        new Error('Network error')
      );

      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Create Invite Form', () => {
    it('should have date and time inputs', async () => {
      render(<InvitesPage />);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Expiration Date/)
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/Expiration Time/)).toBeInTheDocument();
      });
    });

    it('should require expiration date', async () => {
      const user = userEvent.setup();
      render(<InvitesPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Create Invite/ })
        ).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Invite/ });
      expect(createButton).toBeDisabled();
    });

    it('should allow creating invite with valid date and time', async () => {
      const user = userEvent.setup();
      (apiClient.createInviteToken as any).mockResolvedValue({
        created: true,
        token: 'new-token-xyz789',
      });

      render(<InvitesPage />);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Expiration Date/)
        ).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/Expiration Date/) as HTMLInputElement;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await user.type(dateInput, dateStr);

      const createButton = screen.getByRole('button', { name: /Create Invite/ });
      await user.click(createButton);

      await waitFor(() => {
        expect(apiClient.createInviteToken).toHaveBeenCalledWith(
          1,
          expect.any(Date),
          'mock-token'
        );
      });
    });

    it('should show creating state while submitting', async () => {
      const user = userEvent.setup();
      let resolveCreate: (value: any) => void;
      (apiClient.createInviteToken as any).mockReturnValue(
        new Promise((resolve) => {
          resolveCreate = resolve;
        })
      );

      render(<InvitesPage />);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Expiration Date/)
        ).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/Expiration Date/) as HTMLInputElement;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await user.type(dateInput, dateStr);

      const createButton = screen.getByRole('button', { name: /Create Invite/ });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Creating.../ })).toBeDisabled();
      });

      resolveCreate!({ created: true, token: 'new-token' });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Create Invite/ })
        ).toBeInTheDocument();
      });
    });

    it('should handle creation error', async () => {
      const user = userEvent.setup();
      (apiClient.createInviteToken as any).mockResolvedValue({
        created: false,
        error: 'Failed to create token',
      });

      render(<InvitesPage />);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Expiration Date/)
        ).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/Expiration Date/) as HTMLInputElement;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await user.type(dateInput, dateStr);

      const createButton = screen.getByRole('button', { name: /Create Invite/ });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create token')).toBeInTheDocument();
      });
    });

    it('should clear form after successful creation', async () => {
      const user = userEvent.setup();
      (apiClient.createInviteToken as any).mockResolvedValue({
        created: true,
        token: 'new-token-xyz789',
      });
      (apiClient.getClubInviteTokens as any).mockResolvedValueOnce(mockInvites);

      render(<InvitesPage />);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Expiration Date/)
        ).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/Expiration Date/) as HTMLInputElement;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await user.type(dateInput, dateStr);

      const createButton = screen.getByRole('button', { name: /Create Invite/ });
      await user.click(createButton);

      // After successful creation and refetch, date input should be cleared
      await waitFor(() => {
        expect(dateInput.value).toBe('');
      });
    });
  });

  describe('Copy Token', () => {
    it('should have copy button for each token', async () => {
      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText(/token-abc123/)).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByRole('button', { name: /Copy Link/ });
      expect(copyButtons.length).toBeGreaterThan(0);
    });

    it('should show copied confirmation after clicking copy', async () => {
      const user = userEvent.setup();
      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText(/token-abc123/)).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByRole('button', { name: /Copy Link/ });
      await user.click(copyButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Copied!/ })).toBeInTheDocument();
      });
    });
  });

  describe('Delete Invite', () => {
    it('should show confirmation before delete', async () => {
      const user = userEvent.setup();
      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText(/token-abc123/)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      await user.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure')
      );
    });

    it('should not delete if user cancels confirmation', async () => {
      const user = userEvent.setup();
      global.confirm = vi.fn(() => false);

      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText(/token-abc123/)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      await user.click(deleteButtons[0]);

      expect(apiClient.deleteInviteToken).not.toHaveBeenCalled();
    });

    it('should delete invite when confirmed', async () => {
      const user = userEvent.setup();
      (apiClient.deleteInviteToken as any).mockResolvedValue({
        deleted: true,
      });

      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText(/token-abc123/)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(apiClient.deleteInviteToken).toHaveBeenCalledWith(
          1,
          'token-abc123',
          'mock-token'
        );
      });
    });

    it('should show deleting state while deleting', async () => {
      const user = userEvent.setup();
      let resolveDelete: (value: any) => void;
      (apiClient.deleteInviteToken as any).mockReturnValue(
        new Promise((resolve) => {
          resolveDelete = resolve;
        })
      );

      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText(/token-abc123/)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Deleting.../ })
        ).toBeDisabled();
      });

      resolveDelete!({ deleted: true });

      await waitFor(() => {
        const deleteBtn = screen.getAllByRole('button', { name: /Delete/ })[0];
        expect(deleteBtn).not.toBeDisabled();
      });
    });

    it('should handle delete error', async () => {
      const user = userEvent.setup();
      (apiClient.deleteInviteToken as any).mockResolvedValue({
        deleted: false,
        error: 'Failed to delete token',
      });

      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText(/token-abc123/)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete token')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back to club details', async () => {
      const user = userEvent.setup();
      render(<InvitesPage />);

      await waitFor(() => {
        expect(screen.getByText('Manage Invites')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /Back to Club/ });
      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/admin/clubs/1');
    });
  });

  describe('Empty State', () => {
    it('should show message when no invites exist', async () => {
      (apiClient.getClubInviteTokens as any).mockResolvedValue([]);

      render(<InvitesPage />);

      await waitFor(() => {
        expect(
          screen.getByText(
            /No invite tokens created yet. Create one above to get started./
          )
        ).toBeInTheDocument();
      });
    });
  });
});
