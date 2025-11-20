import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { UserProvider } from "@/components/user-provider";
import "./globals.scss";
import { Archivo_Black, Roboto_Condensed, Roboto } from "next/font/google";

export const dynamic = "force-dynamic";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
});

const roboto = Roboto({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

const robotoCondensed = Roboto_Condensed({
  weight: ["100", "400", "900"],
  subsets: ["latin"],
  variable: "--font-roboto-condensed",
});

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
        <body
          className={`antialiased ${archivoBlack.variable} ${robotoCondensed.variable} ${roboto.variable}`}
        >
          <UserProvider>{children}</UserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
