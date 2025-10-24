import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import Home from "./page";
import { useClubCheck } from "@/hooks/useClubCheck";

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

vi.mock("@/hooks/useClubCheck", () => ({
  useClubCheck: vi.fn(),
}));

vi.mock("@/components/ClubGuard", () => ({
  ClubGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/navbar", () => ({
  Navbar: () => <div>Navbar</div>,
}));

describe("Home Page", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
  });

  it("should show loading spinner initially", () => {
    (useClubCheck as any).mockReturnValue({
      clubId: null,
      loading: true,
      hasClub: false,
    });

    render(<Home />);

    // Check for loading spinner
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("should redirect to club appointments when clubId is available", async () => {
    (useClubCheck as any).mockReturnValue({
      clubId: 42,
      loading: false,
      hasClub: true,
    });

    render(<Home />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/club/42/appointments");
    });
  });

  it("should show loading spinner when club check is in progress", async () => {
    (useClubCheck as any).mockReturnValue({
      clubId: null,
      loading: true,
      hasClub: false,
    });

    render(<Home />);

    // The ClubGuard will show the "Club Assignment Required" message,
    // but HomeContent will show the loading spinner
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("should not redirect if clubId is null", () => {
    (useClubCheck as any).mockReturnValue({
      clubId: null,
      loading: false,
      hasClub: false,
    });

    render(<Home />);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should redirect with correct club ID from useClubCheck", async () => {
    const clubId = 123;

    (useClubCheck as any).mockReturnValue({
      clubId,
      loading: false,
      hasClub: true,
    });

    render(<Home />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/club/${clubId}/appointments`);
    });
  });
});
