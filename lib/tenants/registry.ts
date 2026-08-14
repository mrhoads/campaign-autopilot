import type { Tenant } from "./types";
import { contosoTenant } from "./contoso";

/**
 * Tenant registry — the list of brands available in the switcher.
 * Order here is the order shown in the dropdown.
 *
 * Contoso Financial Services is fictional (Contoso is Microsoft's standard
 * sample company name). Nothing here represents a real organization's brand
 * guidelines, compliance policy, or campaign data.
 *
 * The app is multi-tenant by design: adding a brand means adding one `Tenant`
 * object to this array. No UI code changes.
 */
export const TENANTS: Tenant[] = [contosoTenant];

export const DEFAULT_TENANT_ID = contosoTenant.id;

const BY_ID = new Map(TENANTS.map((t) => [t.id, t]));

/** Resolve a tenant by id, falling back to the default when unknown. */
export function getTenant(id: string | null | undefined): Tenant {
  if (id && BY_ID.has(id)) return BY_ID.get(id)!;
  return BY_ID.get(DEFAULT_TENANT_ID)!;
}

export function listTenants(): Tenant[] {
  return TENANTS;
}

export type { Tenant } from "./types";
