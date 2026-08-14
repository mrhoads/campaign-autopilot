"use client";

import { ApprovalCenter } from "@/components/approvals/ApprovalCenter";
import { useTenant } from "@/lib/tenants/context";

export default function ApprovalsPage() {
  const { tenant } = useTenant();
  return <ApprovalCenter key={tenant.id} initialPackages={tenant.content.approvalPackages} />;
}
