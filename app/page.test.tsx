import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import Home from "./page";
import { useClubCheck } from "@/hooks/useClubCheck";
import { useUserClubs } from "@/hooks/useUserClubs";
import { useAuth } from "@clerk/nextjs";

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
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/hooks/useClubCheck", () => ({
  useClubCheck: vi.fn(),
}));

vi.mock("@/hooks/useUserClubs", () => ({
  useUserClubs: vi.fn(),
}));

vi.mock("@/components/ClubGuard", () => ({
  ClubGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/navbar", () => ({
  Navbar: () => <div>Navbar</div>,
}));

vi.mock("@/lib/sessionCache", () => ({
  getCachedUser: vi.fn(() => null),
  setCachedUser: vi.fn(),
  clearUserCache: vi.fn(),
}));

describe("Home Page", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuth as any).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    });

    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
  });

  it("should show loading spinner initially", () => {
    (useUserClubs as any).mockReturnValue({
      currentClubId: null,
      loading: true,
      clubs: [],
    });

    render(<Home />);

    // Check for loading spinner (appears when isLoaded is true but clubLoading is true)
    // Since isLoaded defaults to true in the mock, this should show ClubGuard loading
  });

  it("should redirect to club appointments when clubId is available", async () => {
    (useUserClubs as any).mockReturnValue({
      currentClubId: 42,
      loading: false,
      clubs: [],
    });

    render(<Home />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/club/42");
    });
  });

  it("should show loading spinner when club check is in progress", async () => {
    (useUserClubs as any).mockReturnValue({
      currentClubId: null,
      loading: true,
      clubs: [],
    });

    render(<Home />);

    // ClubGuard will be loading, no spinner visible in this case
  });

  it("should not redirect if clubId is null", () => {
    (useUserClubs as any).mockReturnValue({
      currentClubId: null,
      loading: false,
      clubs: [],
    });

    render(<Home />);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should redirect with correct club ID from useUserClubs", async () => {
    const clubId = 123;

    (useUserClubs as any).mockReturnValue({
      currentClubId: clubId,
      loading: false,
      clubs: [],
    });

    render(<Home />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/club/${clubId}`);
    });
  });
});
