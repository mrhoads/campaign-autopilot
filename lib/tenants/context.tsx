"use client";

import * as React from "react";
import {
  DEFAULT_TENANT_ID,
  getTenant,
  listTenants,
} from "./registry";
import { readStoredTenantId, setActiveTenantId } from "./active";
import type { Tenant } from "./types";

interface TenantContextValue {
  tenant: Tenant;
  tenantId: string;
  setTenantId: (id: string) => void;
  tenants: Tenant[];
  /** True once the persisted choice has been read on the client. */
  ready: boolean;
}

const TenantContext = React.createContext<TenantContextValue | null>(null);

/**
 * Provides the active demo tenant to the whole app.
 *
 * The persisted choice lives in localStorage (via `active.ts`). To avoid a
 * hydration mismatch and a flash of the wrong brand, the provider renders a
 * minimal placeholder until it has read the stored value on the client.
 */
export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenantId, setTenantIdState] = React.useState<string>(DEFAULT_TENANT_ID);
  const [ready, setReady] = React.useState(false);

  // On mount, hydrate from the persisted choice.
  React.useEffect(() => {
    const stored = readStoredTenantId();
    setActiveTenantId(stored);
    setTenantIdState(stored);
    setReady(true);
  }, []);

  // Keep the browser tab title in sync with the active brand.
  React.useEffect(() => {
    if (!ready) return;
    document.title = getTenant(tenantId).appName;
  }, [tenantId, ready]);

  const setTenantId = React.useCallback((id: string) => {
    setActiveTenantId(id);
    setTenantIdState(id);
  }, []);

  const value = React.useMemo<TenantContextValue>(
    () => ({
      tenant: getTenant(tenantId),
      tenantId,
      setTenantId,
      tenants: listTenants(),
      ready,
    }),
    [tenantId, setTenantId, ready],
  );

  // Avoid rendering brand-specific content (and a hydration mismatch) until
  // the persisted tenant is known. The placeholder matches the app backdrop.
  if (!ready) {
    return <div className="min-h-screen bg-[#04081a]" aria-hidden />;
  }

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = React.useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return ctx;
}
