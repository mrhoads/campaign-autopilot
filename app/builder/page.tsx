"use client";

import { BuilderWorkspace } from "@/components/builder/BuilderWorkspace";
import { useTenant } from "@/lib/tenants/context";

export default function BuilderPage() {
  const { tenant } = useTenant();
  return <BuilderWorkspace key={tenant.id} initialBrief={tenant.content.primaryBrief} />;
}
