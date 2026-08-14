import type { Tenant } from "./types";
import { contosoTenant } from "./contoso";
import { fabrikamTenant } from "./fabrikam";
import { northwindTenant } from "./northwind";

/**
 * Tenant registry — the list of demo brands available in the switcher.
 * Order here is the order shown in the dropdown.
 *
 * All brands are fictional. Contoso, Fabrikam, and Northwind are the standard
 * Microsoft sample company names; none of this content represents a real
 * organization's brand guidelines, compliance policy, or campaign data.
 */
export const TENANTS: Tenant[] = [contosoTenant, fabrikamTenant, northwindTenant];

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
