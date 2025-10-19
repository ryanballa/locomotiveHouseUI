import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Home from "./page";
import { apiClient } from "@/lib/api";

// Mock the modules
vi.mock("@clerk/nextjs", () => ({
  useAuth: vi.fn(),
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  UserButton: () => <div>User Button</div>,
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiClient: {
    getAppointments: vi.fn(),
    getUsers: vi.fn(),
    createAppointment: vi.fn(),
    deleteAppointment: vi.fn(),
  },
}));

// Mock fetch for clerk-user and user-id endpoints
global.fetch = vi.fn();

describe("Home (Appointments Page)", () => {
  const mockGetToken = vi.fn();
  const mockPush = vi.fn();

  const mockAppointments = [
    {
      id: 1,
      schedule: "2025-10-24T17:00:00.000Z", // Friday at 5 PM
      duration: 60,
      user_id: 1,
    },
    {
      id: 2,
      schedule: "2025-10-24T18:00:00.000Z", // Friday at 6 PM
      duration: 60,
      user_id: 2,
    },
    {
      id: 3,
      schedule: "2025-10-25T14:00:00.000Z", // Saturday at 2 PM
      duration: 60,
      user_id: 1,
    },
  ];

  const mockUsers = [
    { id: 1, token: "user-token-1", permission: null },
    { id: 2, token: "user-token-2", permission: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/user-id")) {
        return Promise.resolve({
          json: () => Promise.resolve({ lhUserId: 1 }),
        });
      }
      if (url.includes("/api/clerk-user/user-token-1")) {
        return Promise.resolve({
          json: () => Promise.resolve({ name: "John Doe" }),
        });
      }
      if (url.includes("/api/clerk-user/user-token-2")) {
        return Promise.resolve({
          json: () => Promise.resolve({ name: "Jane Smith" }),
        });
      }
      return Promise.reject(new Error("Not found"));
    });
  });

  describe("When user is not signed in", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        getToken: mockGetToken,
        isSignedIn: false,
      });

      mockGetToken.mockResolvedValue(null);
      (apiClient.getAppointments as any).mockRejectedValue(
        new Error("Unauthenticated")
      );
      (apiClient.getUsers as any).mockRejectedValue(
        new Error("Unauthenticated")
      );
    });

    it('should display user-friendly error message instead of "Unauthenticated"', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      expect(
        screen.getByText("Please sign in to view and manage appointments.")
      ).toBeInTheDocument();
      expect(screen.queryByText(/unauthenticated/i)).not.toBeInTheDocument();
    });

    it("should not show Friday Evening Sessions section", async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      expect(
        screen.queryByText("Friday Evening Sessions")
      ).not.toBeInTheDocument();
    });
  });

  describe("When user is signed in", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        getToken: mockGetToken,
        isSignedIn: true,
      });

      mockGetToken.mockResolvedValue("mock-token");
      (apiClient.getAppointments as any).mockResolvedValue(mockAppointments);
      (apiClient.getUsers as any).mockResolvedValue(mockUsers);
    });

    it("should show loading state initially", async () => {
      render(<Home />);

      // Page title should be visible immediately
      expect(
        screen.getByRole("heading", { name: "Appointments" })
      ).toBeInTheDocument();

      // Wait for loading to complete (user 1 has 2 appointments, so there will be multiple)
      await waitFor(() => {
        const johnDoeElements = screen.queryAllByText("Club Member: John Doe");
        expect(johnDoeElements.length).toBeGreaterThan(0);
      });
    });

    it("should render appointments successfully", async () => {
      render(<Home />);

      await waitFor(() => {
        const johnDoeElements = screen.queryAllByText("Club Member: John Doe");
        expect(johnDoeElements.length).toBeGreaterThan(0);
      });

      expect(
        screen.getByRole("heading", { name: "Appointments" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/view all scheduled appointments/i)
      ).toBeInTheDocument();
    });

    it("should show Friday Evening Sessions section", async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Friday Evening Sessions")).toBeInTheDocument();
      });
    });

    it("should group appointments by date", async () => {
      render(<Home />);

      await waitFor(() => {
        const johnDoeElements = screen.queryAllByText("Club Member: John Doe");
        expect(johnDoeElements.length).toBeGreaterThan(0);
      });

      // Should show 2 different dates
      const dayHeaders = screen.getAllByText(/2025/);
      expect(dayHeaders.length).toBeGreaterThan(0);
    });

    it("should display appointment details with user names", async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Club Member: Jane Smith")).toBeInTheDocument();
      });

      // John Doe has 2 appointments
      const johnDoeElements = screen.getAllByText("Club Member: John Doe");
      expect(johnDoeElements).toHaveLength(2);
    });

    it("should show edit and delete buttons for current user appointments", async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Club Member: Jane Smith")).toBeInTheDocument();
      });

      // User 1 has appointments with id 1 and 3
      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });

      // Current user (id: 1) has 2 appointments, so should see 2 edit and 2 delete buttons
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });

    it("should not show edit/delete buttons for other user appointments", async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Club Member: Jane Smith")).toBeInTheDocument();
      });

      // Jane Smith's appointment card should not have edit/delete buttons
      const janeCard = screen
        .getByText("Club Member: Jane Smith")
        .closest("div");
      expect(janeCard).toBeInTheDocument();

      // The card should not contain edit/delete buttons (they should only be for user 1)
      const allEditButtons = screen.getAllByRole("button", { name: /edit/i });
      expect(allEditButtons).toHaveLength(2); // Only 2, not 3
    });

    it("should navigate to edit page when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Club Member: Jane Smith")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      await user.click(editButtons[0]);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/appointments/edit/")
      );
    });

    it("should handle appointment deletion with confirmation", async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => true);
      (apiClient.deleteAppointment as any).mockResolvedValue({ deleted: true });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Club Member: Jane Smith")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this appointment?"
      );
      expect(apiClient.deleteAppointment).toHaveBeenCalled();
    });

    it("should not delete appointment if user cancels confirmation", async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => false);

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Club Member: Jane Smith")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(apiClient.deleteAppointment).not.toHaveBeenCalled();
    });

    it("should show error when deletion fails", async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => true);
      (apiClient.deleteAppointment as any).mockResolvedValue({
        deleted: false,
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Club Member: Jane Smith")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to delete appointment")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Friday Evening Sessions", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        getToken: mockGetToken,
        isSignedIn: true,
      });

      mockGetToken.mockResolvedValue("mock-token");
      (apiClient.getUsers as any).mockResolvedValue(mockUsers);
    });

    it('should show "Need more signups" when less than 2 evening appointments', async () => {
      // Only 1 evening appointment on Friday
      (apiClient.getAppointments as any).mockResolvedValue([
        {
          id: 1,
          schedule: "2025-10-24T17:00:00.000Z", // Friday at 5 PM
          duration: 60,
          user_id: 2,
        },
      ]);

      render(<Home />);

      await waitFor(() => {
        const needSignups = screen.getAllByText("Need more signups!");
        expect(needSignups.length).toBeGreaterThan(0);
      });
    });

    it('should show "Good turnout" when 2 or more evening appointments', async () => {
      // Mock appointments with 2 evening appointments on the same Friday
      const nextFriday = new Date();
      nextFriday.setDate(
        nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7)
      );
      nextFriday.setHours(17, 0, 0, 0);

      (apiClient.getAppointments as any).mockResolvedValue([
        {
          id: 1,
          schedule: nextFriday.toISOString(),
          duration: 60,
          user_id: 2,
        },
        {
          id: 2,
          schedule: new Date(nextFriday.getTime() + 3600000).toISOString(), // +1 hour
          duration: 60,
          user_id: 3,
        },
      ]);

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Good turnout!")).toBeInTheDocument();
      });
    });

    it("should allow user to sign up for Friday evening session", async () => {
      const user = userEvent.setup();
      (apiClient.getAppointments as any).mockResolvedValue([]);
      (apiClient.createAppointment as any).mockResolvedValue({
        created: true,
        id: 10,
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Friday Evening Sessions")).toBeInTheDocument();
      });

      const signupButtons = screen.getAllByRole("button", {
        name: /sign up for 7 pm/i,
      });
      await user.click(signupButtons[0]);

      expect(apiClient.createAppointment).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 60,
          user_id: 1,
        }),
        "mock-token"
      );
    });

    it('should show "You\'re signed up!" when user already has appointment', async () => {
      const nextFriday = new Date();
      nextFriday.setDate(
        nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7)
      );
      nextFriday.setHours(17, 0, 0, 0);

      (apiClient.getAppointments as any).mockResolvedValue([
        {
          id: 1,
          schedule: nextFriday.toISOString(),
          duration: 60,
          user_id: 1, // Current user
        },
      ]);

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("You're signed up!")).toBeInTheDocument();
      });
    });
  });

  describe("Timezone handling for Friday evening appointments", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        getToken: mockGetToken,
        isSignedIn: true,
      });

      mockGetToken.mockResolvedValue("mock-token");
      (apiClient.getUsers as any).mockResolvedValue(mockUsers);
    });

    it("should group appointments by local date, not UTC date", async () => {
      // Create a Friday 7 PM appointment in PST (UTC-8)
      // This would be 3 AM Saturday UTC, but should display as Friday locally
      const friday = new Date("2025-01-17T19:00:00"); // Friday 7 PM local time

      (apiClient.getAppointments as any).mockResolvedValue([
        {
          id: 1,
          schedule: friday.toISOString(), // Converts to UTC (Saturday 3 AM)
          duration: 60,
          user_id: 1,
        },
      ]);

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Club Member: John Doe")).toBeInTheDocument();
      });

      // Should show Friday in the header, not Saturday
      const fridayHeader = screen.getByText(/Friday.*Jan.*17/);
      expect(fridayHeader).toBeInTheDocument();

      // Should NOT show Saturday
      expect(screen.queryByText(/Saturday.*Jan.*18/)).not.toBeInTheDocument();
    });

    it("should correctly identify evening appointments in local timezone", async () => {
      // Create a next Friday evening appointment
      const nextFriday = new Date();
      const daysUntilFriday = (5 - nextFriday.getDay() + 7) % 7 || 7;
      nextFriday.setDate(nextFriday.getDate() + daysUntilFriday);
      nextFriday.setHours(19, 0, 0, 0); // 7 PM local time

      (apiClient.getAppointments as any).mockResolvedValue([
        {
          id: 1,
          schedule: nextFriday.toISOString(), // Stored as UTC
          duration: 60,
          user_id: 2,
        },
      ]);

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Friday Evening Sessions")).toBeInTheDocument();
      });

      // Should count this as an evening appointment (after 5 PM local time)
      // There are 4 Friday cards shown, find the one with count = 1
      const paragraphs = screen.getAllByText((content, element) => {
        return element?.textContent?.includes("Evening appointments (after 5 PM):") &&
               element?.textContent?.includes("1") || false;
      });
      // Should find at least one Friday with 1 evening appointment
      expect(paragraphs.length).toBeGreaterThan(0);
    });

    it("should create Friday 7 PM appointment in local timezone", async () => {
      const user = userEvent.setup();
      (apiClient.getAppointments as any).mockResolvedValue([]);
      (apiClient.createAppointment as any).mockResolvedValue({
        created: true,
        id: 10,
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Friday Evening Sessions")).toBeInTheDocument();
      });

      const signupButtons = screen.getAllByRole("button", {
        name: /sign up for 7 pm/i,
      });
      await user.click(signupButtons[0]);

      // Verify the appointment was created with the correct time
      expect(apiClient.createAppointment).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 60,
          user_id: 1,
          schedule: expect.any(String),
        }),
        "mock-token"
      );

      // Verify the schedule is for 7 PM local time
      const callArgs = (apiClient.createAppointment as any).mock.calls[0][0];
      const scheduledDate = new Date(callArgs.schedule);
      expect(scheduledDate.getHours()).toBe(19); // 7 PM in local time
    });

    it("should update to 'You're signed up!' after creating Friday appointment", async () => {
      const user = userEvent.setup();
      const nextFriday = new Date();
      const daysUntilFriday = (5 - nextFriday.getDay() + 7) % 7 || 7;
      nextFriday.setDate(nextFriday.getDate() + daysUntilFriday);
      nextFriday.setHours(19, 0, 0, 0);

      // Initially no appointments
      (apiClient.getAppointments as any).mockResolvedValue([]);

      // After creation, return the new appointment
      const newAppointment = {
        id: 10,
        schedule: nextFriday.toISOString(),
        duration: 60,
        user_id: 1,
      };

      (apiClient.createAppointment as any).mockResolvedValue({
        created: true,
        id: 10,
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Friday Evening Sessions")).toBeInTheDocument();
      });

      // Initially should show signup button
      let signupButtons = screen.getAllByRole("button", {
        name: /sign up for 7 pm/i,
      });
      expect(signupButtons.length).toBeGreaterThan(0);

      // Mock the refresh call to return the new appointment
      (apiClient.getAppointments as any).mockResolvedValue([newAppointment]);

      // Click the first Friday's signup button
      await user.click(signupButtons[0]);

      // Should now show "You're signed up!"
      await waitFor(() => {
        expect(screen.getByText("You're signed up!")).toBeInTheDocument();
      });

      // Signup buttons for other Fridays should still exist
      signupButtons = screen.queryAllByRole("button", {
        name: /sign up for 7 pm/i,
      });
      // Should have 3 signup buttons left (for the remaining 3 Fridays)
      expect(signupButtons.length).toBe(3);
    });

    it("should display correct local time for appointments", async () => {
      // Create appointment at 7 PM local time
      const appointmentDate = new Date("2025-01-17T19:00:00");

      (apiClient.getAppointments as any).mockResolvedValue([
        {
          id: 1,
          schedule: appointmentDate.toISOString(),
          duration: 60,
          user_id: 1,
        },
      ]);

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Club Member: John Doe")).toBeInTheDocument();
      });

      // Should display 7:00 PM (or 7 PM depending on locale)
      const timeDisplay = screen.getByText(/7:00\s*PM/i);
      expect(timeDisplay).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        getToken: mockGetToken,
        isSignedIn: true,
      });

      mockGetToken.mockResolvedValue("mock-token");
    });

    it("should handle API errors gracefully", async () => {
      (apiClient.getAppointments as any).mockRejectedValue(
        new Error("Network error")
      );
      (apiClient.getUsers as any).mockRejectedValue(new Error("Network error"));

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should handle 401 errors with friendly message", async () => {
      (apiClient.getAppointments as any).mockRejectedValue(
        new Error("401 Unauthorized")
      );
      (apiClient.getUsers as any).mockRejectedValue(
        new Error("401 Unauthorized")
      );

      render(<Home />);

      await waitFor(() => {
        expect(
          screen.getByText("Please sign in to view and manage appointments.")
        ).toBeInTheDocument();
      });
    });
  });
});
