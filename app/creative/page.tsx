"use client";

import { CreativeWorkspace } from "@/components/creative/CreativeWorkspace";
import { useTenant } from "@/lib/tenants/context";

export default function CreativePage() {
  const { tenant } = useTenant();
  return (
    <CreativeWorkspace
      key={tenant.id}
      initialConcepts={tenant.content.creativeConcepts}
      initialToolStatus={tenant.content.creativeToolStatus}
      brief={tenant.content.primaryBrief}
    />
  );
}
