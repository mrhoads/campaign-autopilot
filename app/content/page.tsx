"use client";

import { ContentWorkspace } from "@/components/content/ContentWorkspace";
import { useTenant } from "@/lib/tenants/context";

export default function ContentPage() {
  const { tenant } = useTenant();
  return (
    <ContentWorkspace
      key={tenant.id}
      brief={tenant.content.primaryBrief}
      initialVariants={tenant.content.contentVariants}
    />
  );
}
