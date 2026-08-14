"use client";

import { DEFAULT_TENANT_ID, getTenant } from "./registry";
import type { Tenant } from "./types";

/**
 * Client-side "active tenant" singleton.
 *
 * The React context (`TenantProvider`) is the source of truth for components,
 * but non-React code — the client service layer in `lib/services/*` — needs to
 * know the active tenant too (to pick the right mock content and to tell the
 * API routes which brand to speak as). This module bridges that gap and keeps
 * the choice persisted in localStorage so it survives a refresh.
 */

const STORAGE_KEY = "demo.activeTenantId";

let activeTenantId: string = DEFAULT_TENANT_ID;

/** Read the persisted tenant id (client only). Safe to call during SSR. */
export function readStoredTenantId(): string {
  if (typeof window === "undefined") return DEFAULT_TENANT_ID;
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_TENANT_ID;
  } catch {
    return DEFAULT_TENANT_ID;
  }
}

/** Set the active tenant id, persisting it. Called by the provider. */
export function setActiveTenantId(id: string): void {
  activeTenantId = id;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function getActiveTenantId(): string {
  return activeTenantId;
}

/** The active tenant object, for the service layer. */
export function getActiveTenant(): Tenant {
  return getTenant(activeTenantId);
}
