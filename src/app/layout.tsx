import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SplashScreen } from "@/components/SplashScreen";

const fontHeading = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "JNext - The Ultimate AI Platform",
  description: "All-in-one AI platform for Chat, Coding, Images, Video, and more.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontBody.className} ${fontHeading.variable} ${fontBody.variable} antialiased`}
      >
        <SplashScreen />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
