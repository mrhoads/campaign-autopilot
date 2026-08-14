"use client";

import { HeroPanel } from "@/components/dashboard/HeroPanel";
import { RecentCampaignsGrid } from "@/components/dashboard/RecentCampaignsGrid";
import { BrandStatusPanel } from "@/components/dashboard/BrandStatusPanel";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTenant } from "@/lib/tenants/context";
import { FileEdit, Hourglass, AlertTriangle, Package } from "lucide-react";

export default function DashboardPage() {
  const { tenant } = useTenant();
  const { dashboardKpis, recentCampaigns } = tenant.content;

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Workspace overview"
        title={tenant.content.dashboardGreeting}
        description={tenant.content.dashboardDescription}
      />

      <div className="px-4 md:px-6 lg:px-8 mt-6 space-y-8">
        <HeroPanel />

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Campaigns in draft"
            value={dashboardKpis.campaignsInDraft}
            delta={{ value: "+2 this week", trend: "up" }}
            icon={FileEdit}
            accent="brand"
          />
          <MetricCard
            label="Awaiting approval"
            value={dashboardKpis.awaitingApproval}
            delta={{ value: "−1 vs yesterday", trend: "down" }}
            icon={Hourglass}
            accent="amber"
          />
          <MetricCard
            label="Brand issues flagged"
            value={dashboardKpis.brandIssuesFlagged}
            delta={{ value: "2 resolvable", trend: "flat" }}
            icon={AlertTriangle}
            accent="rose"
          />
          <MetricCard
            label="Content packages generated"
            value={dashboardKpis.contentPackagesGenerated}
            delta={{ value: "+6 this week", trend: "up" }}
            icon={Package}
            accent="emerald"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <section>
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-brand-200/80">
                  Active workstreams
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Recent campaigns
                </h3>
              </div>
              <div className="text-xs text-slate-400">
                Sorted by recent activity
              </div>
            </div>
            <RecentCampaignsGrid campaigns={recentCampaigns} />
          </section>

          <BrandStatusPanel />
        </div>
      </div>
    </div>
  );
}
