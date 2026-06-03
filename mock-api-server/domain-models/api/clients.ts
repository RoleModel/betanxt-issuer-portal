import type { components } from "@/types/api";

import { supabase } from "@/utils/supabase/client";

// Use generated types from OpenAPI schema
type Client = components["schemas"]["Clients"];
type CreateClientRequest = components["schemas"]["CreateClientRequest"];
type UpdateClientRequest = components["schemas"]["UpdateClientRequest"];

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
  created_at?: string | null;
  updated_at?: string | null;
  enabled_features?: unknown;
}

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
        )[])
      : undefined,
  };
}

export async function listClients(
  _page?: number,
  limit?: number,
  ticker?: string,
): Promise<ApiResponse<{ clients?: Client[]; pagination?: components["schemas"]["Pagination"] }>> {
  let query = supabase.from("clients").select("*");

  if (ticker) query = query.eq("ticker", ticker);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    return { error: { message: error.message } };
  }

  const clients = (data as ClientRow[]).map(transformClient);
  return { data: { clients } };
}

export async function createClient(clientData: CreateClientRequest): Promise<ApiResponse<Client>> {
  const dbInsert: Record<string, unknown> = {};
  if (clientData.ticker !== undefined) dbInsert.ticker = clientData.ticker;
  if (clientData.companyName !== undefined) dbInsert.company_name = clientData.companyName;
  if (clientData.shortName !== undefined) dbInsert.short_name = clientData.shortName;
  if (clientData.industry !== undefined) dbInsert.industry = clientData.industry;
  if (clientData.description !== undefined) dbInsert.description = clientData.description;
  if (clientData.website !== undefined) dbInsert.website = clientData.website;
  if (clientData.primaryContact !== undefined) dbInsert.primary_contact = clientData.primaryContact;
  if (clientData.primaryContactEmail !== undefined)
    dbInsert.primary_contact_email = clientData.primaryContactEmail;
  if (clientData.isActive !== undefined) dbInsert.is_active = clientData.isActive;
  if (clientData.enabledFeatures !== undefined)
    dbInsert.enabled_features = clientData.enabledFeatures;

  const { data, error } = await supabase.from("clients").insert(dbInsert).select().single();

  if (error) return { error: { message: error.message } };

  return { data: transformClient(data as ClientRow) };
}

export async function getClientByTicker(ticker: string): Promise<ApiResponse<Client>> {
  const { data, error } = await supabase.from("clients").select("*").eq("ticker", ticker).single();

  if (error) return { error: { message: error.message, statusCode: 404 } };

  return { data: transformClient(data as ClientRow) };
}

export async function updateClient(
  ticker: string,
  clientData: UpdateClientRequest,
): Promise<ApiResponse<Client>> {
  const dbUpdate: Record<string, unknown> = {};
  if (clientData.companyName !== undefined) dbUpdate.company_name = clientData.companyName;
  if (clientData.shortName !== undefined) dbUpdate.short_name = clientData.shortName;
  if (clientData.industry !== undefined) dbUpdate.industry = clientData.industry;
  if (clientData.description !== undefined) dbUpdate.description = clientData.description;
  if (clientData.website !== undefined) dbUpdate.website = clientData.website;
  if (clientData.primaryContact !== undefined) dbUpdate.primary_contact = clientData.primaryContact;
  if (clientData.primaryContactEmail !== undefined)
    dbUpdate.primary_contact_email = clientData.primaryContactEmail;
  if (clientData.isActive !== undefined) dbUpdate.is_active = clientData.isActive;
  if (clientData.enabledFeatures !== undefined)
    dbUpdate.enabled_features = clientData.enabledFeatures;

  const { data, error } = await supabase
    .from("clients")
    .update(dbUpdate)
    .eq("ticker", ticker)
    .select()
    .single();

  if (error) return { error: { message: error.message } };

  return { data: transformClient(data as ClientRow) };
}

export async function deleteClient(ticker: string): Promise<ApiResponse<void>> {
  const { error } = await supabase.from("clients").delete().eq("ticker", ticker);

  if (error) return { error: { message: error.message } };

  return { data: undefined };
}
