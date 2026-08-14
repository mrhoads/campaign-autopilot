"use client";

import { ValidationCenter } from "@/components/validation/ValidationCenter";
import { useTenant } from "@/lib/tenants/context";

export default function ValidationPage() {
  // For the demo we seed with the active tenant's curated fixture so the
  // initial render is deterministic. The component re-runs against the live
  // service on demand.
  const { tenant } = useTenant();
  return (
    <ValidationCenter
      key={tenant.id}
      initialResult={tenant.content.primaryValidation}
      rules={tenant.content.brandRules}
    />
  );
}
