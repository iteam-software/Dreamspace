import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/lib/contexts/AppProviders";

export const metadata: Metadata = {
  title: "Dreamspace - Turn Dreams into Reality",
  description: "Goal tracking and team coaching platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
