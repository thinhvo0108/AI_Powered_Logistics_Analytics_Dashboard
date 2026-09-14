import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ReactQueryProvider } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "LogiAI — Logistics Analytics Dashboard",
  description: "AI-powered logistics analytics dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ReactQueryProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 bg-slate-50">{children}</main>
          </div>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
