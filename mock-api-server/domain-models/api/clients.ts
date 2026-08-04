import { randomUUID } from "node:crypto";

import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";

// Use generated types from OpenAPI schema
type Client = components["schemas"]["Clients"];
type CreateClientRequest = components["schemas"]["CreateClientRequest"];
type UpdateClientRequest = components["schemas"]["UpdateClientRequest"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

// Row shape returned by Supabase (snake_case)
interface ClientRow {
  id: string;
  ticker: string;
  company_name?: string | null;
  short_name?: string | null;
  industry?: string | null;
  description?: string | null;
  website?: string | null;
  primary_contact?: string | null;
  primary_contact_email?: string | null;
  is_active?: boolean | null;
  branding_id?: number | null;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  enabled_features?: unknown;
}

/**
 * Transforms a snake_case `clients` row into the camelCase OpenAPI `Clients`
 * shape. `enabledFeatures` is narrowed to the feature-flag union — which now
 * includes `"nobo"` for Engage-enabled clients (002-tabulation-enhancements)
 * — and left `undefined` when the column is not a JSON array.
 *
 * @param row - Raw Supabase client row
 * @returns The API-shaped client
 */
function transformClient(row: ClientRow): Client {
  return {
    id: row.id,
    ticker: row.ticker,
    companyName: row.company_name ?? undefined,
    shortName: row.short_name ?? undefined,
    industry: row.industry ?? undefined,
    description: row.description ?? undefined,
    website: row.website ?? undefined,
    primaryContact: row.primary_contact ?? undefined,
    primaryContactEmail: row.primary_contact_email ?? undefined,
    isActive: row.is_active ?? false,
    brandingId: row.branding_id ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    primaryColor: row.primary_color ?? undefined,
    secondaryColor: row.secondary_color ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    enabledFeatures: Array.isArray(row.enabled_features)
      ? (row.enabled_features as (
          | "documents"
          | "mailing"
          | "tabulation"
          | "reports"
          | "fileTransfer"
          | "agenda"
          | "nobo"
        )[])
      : undefined,
  };
}

export async function listClients(
  _page?: number,
  limit?: number,
  ticker?: string
): Promise<
  ApiResponse<{
    clients?: Client[];
    pagination?: components["schemas"]["Pagination"];
  }>
> {
  let query = supabase.from("clients").select("*");

  if (ticker) {
    query = query.eq("ticker", ticker);
  }
  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    return { error: { message: error.message } };
  }

  const clients = (data as ClientRow[]).map(transformClient);
  return { data: { clients } };
}

export async function createClient(
  clientData: CreateClientRequest
): Promise<ApiResponse<Client>> {
  const databaseInsert: ClientInsert = { id: randomUUID() };
  if (clientData.ticker !== undefined) {
    databaseInsert.ticker = clientData.ticker;
  }
  if (clientData.companyName !== undefined) {
    databaseInsert.company_name = clientData.companyName;
  }
  if (clientData.shortName !== undefined) {
    databaseInsert.short_name = clientData.shortName;
  }
  if (clientData.industry !== undefined) {
    databaseInsert.industry = clientData.industry;
  }
  if (clientData.description !== undefined) {
    databaseInsert.description = clientData.description;
  }
  if (clientData.website !== undefined) {
    databaseInsert.website = clientData.website;
  }
  if (clientData.primaryContact !== undefined) {
    databaseInsert.primary_contact = clientData.primaryContact;
  }
  if (clientData.primaryContactEmail !== undefined) {
    databaseInsert.primary_contact_email = clientData.primaryContactEmail;
  }
  if (clientData.isActive !== undefined) {
    databaseInsert.is_active = clientData.isActive;
  }
  if (clientData.logoUrl !== undefined) {
    databaseInsert.logo_url = clientData.logoUrl;
  }
  if (clientData.primaryColor !== undefined) {
    databaseInsert.primary_color = clientData.primaryColor;
  }
  if (clientData.secondaryColor !== undefined) {
    databaseInsert.secondary_color = clientData.secondaryColor;
  }
  if (clientData.createdBy !== undefined) {
    databaseInsert.created_by = clientData.createdBy;
  }
  if (clientData.enabledFeatures !== undefined) {
    databaseInsert.enabled_features = clientData.enabledFeatures;
  }

  const { data, error } = await supabase
    .from("clients")
    .insert(databaseInsert)
    .select()
    .single();

  // If new optional columns don't exist yet (migration not applied), retry without them
  if (
    error?.message?.includes("column") &&
    (databaseInsert.logo_url !== undefined ||
      databaseInsert.primary_color !== undefined ||
      databaseInsert.secondary_color !== undefined ||
      databaseInsert.created_by !== undefined)
  ) {
    delete databaseInsert.logo_url;
    delete databaseInsert.primary_color;
    delete databaseInsert.secondary_color;
    delete databaseInsert.created_by;
    const { data: data2, error: error2 } = await supabase
      .from("clients")
      .insert(databaseInsert)
      .select()
      .single();
    if (error2) {
      return { error: { message: error2.message } };
    }
    return { data: transformClient(data2 as ClientRow) };
  }

  if (error) {
    return { error: { message: error.message } };
  }

  return { data: transformClient(data as ClientRow) };
}

export async function getClientByTicker(
  ticker: string
): Promise<ApiResponse<Client>> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("ticker", ticker)
    .single();

  if (error) {
    return { error: { message: error.message, statusCode: 404 } };
  }

  return { data: transformClient(data as ClientRow) };
}

export async function updateClient(
  ticker: string,
  clientData: UpdateClientRequest
): Promise<ApiResponse<Client>> {
  const databaseUpdate: ClientUpdate = {};
  if (clientData.companyName !== undefined) {
    databaseUpdate.company_name = clientData.companyName;
  }
  if (clientData.shortName !== undefined) {
    databaseUpdate.short_name = clientData.shortName;
  }
  if (clientData.industry !== undefined) {
    databaseUpdate.industry = clientData.industry;
  }
  if (clientData.description !== undefined) {
    databaseUpdate.description = clientData.description;
  }
  if (clientData.website !== undefined) {
    databaseUpdate.website = clientData.website;
  }
  if (clientData.primaryContact !== undefined) {
    databaseUpdate.primary_contact = clientData.primaryContact;
  }
  if (clientData.primaryContactEmail !== undefined) {
    databaseUpdate.primary_contact_email = clientData.primaryContactEmail;
  }
  if (clientData.isActive !== undefined) {
    databaseUpdate.is_active = clientData.isActive;
  }
  if (clientData.logoUrl !== undefined) {
    databaseUpdate.logo_url = clientData.logoUrl;
  }
  if (clientData.primaryColor !== undefined) {
    databaseUpdate.primary_color = clientData.primaryColor;
  }
  if (clientData.secondaryColor !== undefined) {
    databaseUpdate.secondary_color = clientData.secondaryColor;
  }
  if (clientData.enabledFeatures !== undefined) {
    databaseUpdate.enabled_features = clientData.enabledFeatures;
  }

  const { data, error } = await supabase
    .from("clients")
    .update(databaseUpdate)
    .eq("ticker", ticker)
    .select()
    .single();

  if (error) {
    return { error: { message: error.message } };
  }

  return { data: transformClient(data as ClientRow) };
}

export async function deleteClient(ticker: string): Promise<ApiResponse<void>> {
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("ticker", ticker);

  if (error) {
    return { error: { message: error.message } };
  }

  return { data: undefined };
}
