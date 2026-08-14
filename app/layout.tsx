import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TenantProvider } from "@/lib/tenants/context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Campaign Autopilot",
  description:
    "One prompt to a brand-validated campaign. With guardrails. An AI marketing operations workspace that turns a campaign idea into a channel-ready, compliance-checked content package.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="font-sans antialiased">
        <TenantProvider>
          <TooltipProvider delayDuration={150}>
            <AppShell>{children}</AppShell>
          </TooltipProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
