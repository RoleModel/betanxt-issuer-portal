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
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

export const clientFeatures = [
  "documents",
  "mailing",
  "tabulation",
  "reports",
  "fileTransfer",
  "agenda",
  "nobo",
] as const;
export type ClientFeature = (typeof clientFeatures)[number];
const isClientFeature = (value: unknown): value is ClientFeature =>
  (clientFeatures as readonly unknown[]).includes(value);

/**
 * Transforms a snake_case `clients` row into the camelCase OpenAPI `Clients`
 * shape. `enabledFeatures` is narrowed to the feature-flag union — which now
 * includes `"nobo"` for Engage-enabled clients (002-tabulation-enhancements)
 * — and left `undefined` when the column is not a JSON array.
 *
 * @param row - Raw Supabase client row
 * @returns The API-shaped client
 */
const transformClient = (row: ClientRow): Client => ({
  id: row.id ?? undefined,
  ticker: row.ticker ?? undefined,
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
    ? row.enabled_features.filter(isClientFeature)
    : undefined,
});

// Pagination is not yet implemented; `page` is kept as a positional
// parameter to match the OpenAPI-generated call site's shape.
export const listClients = async (
  // sonarjs/no-unused-function-argument wants the `_` prefix here;
  // naming-convention forbids it — the two rules directly conflict.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _page?: number,
  limit?: number,
  ticker?: string
): Promise<
  ApiResponse<{
    clients?: Client[];
    pagination?: components["schemas"]["Pagination"];
  }>
> => {
  let query = supabase.from("clients").select("*");

  if (ticker !== undefined) {
    query = query.eq("ticker", ticker);
  }
  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error !== null) {
    return { error: { message: error.message } };
  }

  const clients = data.map(transformClient);
  return { data: { clients } };
};

// True when the insert failed because an optional column doesn't exist yet
// (migration not applied) — those columns should be dropped and retried.
const isMissingOptionalColumnError = (
  error: { message: string } | null,
  insert: ClientInsert
): boolean => {
  if (!error?.message.includes("column")) {
    return false;
  }
  const optionalValues = [
    insert.logo_url,
    insert.primary_color,
    insert.secondary_color,
    insert.created_by,
  ];
  return optionalValues.some((value) => value !== undefined);
};

export const createClient = async (
  clientData: CreateClientRequest
): Promise<ApiResponse<Client>> => {
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
  if (isMissingOptionalColumnError(error, databaseInsert)) {
    delete databaseInsert.logo_url;
    delete databaseInsert.primary_color;
    delete databaseInsert.secondary_color;
    delete databaseInsert.created_by;
    const { data: data2, error: error2 } = await supabase
      .from("clients")
      .insert(databaseInsert)
      .select()
      .single();
    if (error2 !== null) {
      return { error: { message: error2.message } };
    }
    return { data: transformClient(data2) };
  }

  if (error !== null) {
    return { error: { message: error.message } };
  }

  return { data: transformClient(data) };
};

export const getClientByTicker = async (
  ticker: string
): Promise<ApiResponse<Client>> => {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("ticker", ticker)
    .single();

  if (error !== null) {
    return { error: { message: error.message, statusCode: 404 } };
  }

  return { data: transformClient(data) };
};

export const updateClient = async (
  ticker: string,
  clientData: UpdateClientRequest
): Promise<ApiResponse<Client>> => {
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

  if (error !== null) {
    return { error: { message: error.message } };
  }

  return { data: transformClient(data) };
};

export const deleteClient = async (
  ticker: string
): Promise<ApiResponse<void>> => {
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("ticker", ticker);

  if (error !== null) {
    return { error: { message: error.message } };
  }

  return {};
};
