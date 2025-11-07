import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { UserSessionProvider } from "@/components/UserSessionProvider";
import "./globals.css";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Locomotive House Appointments",
  description: "Schedule your appointments with Locomotive House",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased">
          <UserSessionProvider>
            {children}
          </UserSessionProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
