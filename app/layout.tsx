import { Root } from "@/components/root";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Sora } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
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
      <Script src="https://sad.adsgram.ai/js/sad.min.js" />
      <Script
        async
        src="https://tganalytics.xyz/index.js"
        type="text/javascript"
      />
      <body
        className={`${sora.variable}  bg-black h-[var(--tg-viewport-height)] w-[var(--tg-viewport-width)]`}
      >
        <Root>{children}</Root>
        <GoogleAnalytics gaId="G-GWY1MVJVZK" />
      </body>
    </html>
  );
}
