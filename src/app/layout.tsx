import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KinCare — Elderly Care & Medication Management Platform",
  description: "Autonomous Geriatric Telemetry, Prescription Timing Guard, and Dual-Interface Caregiving Platform",
};

/**
 * RootLayout Component
 * 
 * Root HTML structure and font variable configuration for the KinCare platform.
 * Sets document language to English and provisions anti-aliased base typography.
 * 
 * @param {LayoutProps<"/">} props - Layout component properties with children
 * @returns {React.ReactElement} The root HTML document wrapper
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-slate-900">{children}</body>
    </html>
  );
}
