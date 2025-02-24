import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Root } from "@/components/root";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Merges Infinite",
  description: "The Merges Infinite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable}  bg-black h-[var(--tg-viewport-height)] w-[var(--tg-viewport-width)]`}
      >
        <Root>{children}</Root>
      </body>
    </html>
  );
}
