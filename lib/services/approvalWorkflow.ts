import type { ApprovalPackage } from "@/types";
import { getActiveTenant } from "@/lib/tenants/active";
import { generateId } from "@/lib/utils";

/**
 * Approval Workflow (mock)
 *
 * Future swap-in: the enterprise approval workflow API. Methods would map to
 * REST/gRPC endpoints (submit package, fetch queue, post review decision).
 */

const latency = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function listPackages(): Promise<ApprovalPackage[]> {
  await latency(80);
  return getActiveTenant().content.approvalPackages;
}

export async function getPackage(id: string): Promise<ApprovalPackage | undefined> {
  await latency(50);
  return getActiveTenant().content.approvalPackages.find((p) => p.id === id);
}

export async function recordDecision(
  packageId: string,
  reviewer: string,
  decision: "approve" | "request_changes",
  message: string,
): Promise<ApprovalPackage | undefined> {
  await latency(300);
  const pkg = getActiveTenant().content.approvalPackages.find(
    (p) => p.id === packageId,
  );
  if (!pkg) return undefined;

  const updated: ApprovalPackage = {
    ...pkg,
    status:
      decision === "approve"
        ? pkg.reviewers.every(
            (r) => r.name === reviewer || r.decision === "approve",
          )
          ? "approved"
          : "in_review"
        : "changes_requested",
    reviewers: pkg.reviewers.map((r) =>
      r.name === reviewer ? { ...r, decision } : r,
    ),
    comments: [
      ...pkg.comments,
      {
        id: generateId("cmt"),
        author: reviewer,
        role:
          pkg.reviewers.find((r) => r.name === reviewer)?.role ?? "Reviewer",
        timestampIso: new Date().toISOString(),
        message,
        decision,
      },
    ],
    history: [
      ...pkg.history,
      {
        timestampIso: new Date().toISOString(),
        label: decision === "approve" ? "Review approved" : "Changes requested",
        description: `${reviewer}: ${message}`,
      },
    ],
  };
  return updated;
}
