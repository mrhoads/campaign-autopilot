"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/types";

const LABEL: Record<CampaignStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  needs_changes: "Needs changes",
  live: "Live",
  archived: "Archived",
};

const VARIANT: Record<
  CampaignStatus,
  "default" | "secondary" | "success" | "warning" | "danger" | "info"
> = {
  draft: "secondary",
  in_review: "info",
  approved: "success",
  needs_changes: "warning",
  live: "default",
  archived: "secondary",
};

export function StatusPill({
  status,
  className,
}: {
  status: CampaignStatus;
  className?: string;
}) {
  return (
    <Badge variant={VARIANT[status]} className={cn("capitalize", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {LABEL[status]}
    </Badge>
  );
}
