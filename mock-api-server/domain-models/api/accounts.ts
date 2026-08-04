import { randomUUID } from "node:crypto";

import { listUserAccounts as listAccountsForUser } from "./users";
import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";

// Use generated types from OpenAPI schema
type Account = components["schemas"]["Account"];
type CreateAccountRequest = components["schemas"]["CreateAccountRequest"];
type UpdateAccountRequest = components["schemas"]["UpdateAccountRequest"];
type Pagination = components["schemas"]["Pagination"];
type AccountRow = Database["public"]["Tables"]["account"]["Row"];
type AccountUpdate = Database["public"]["Tables"]["account"]["Update"];

// Helper type for backend responses
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}

// Helper function to convert null to undefined
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

/**
 * Maps an `account` row onto the OpenAPI `Account` shape, converting
 * snake_case columns to camelCase and nulls to undefined.
 *
 * @param databaseAccount - Raw row from the `account` table
 * @returns The account in API representation
 */
function transformAccount(databaseAccount: AccountRow): Account {
  return {
    id: nullToUndefined(databaseAccount.id),
    name: nullToUndefined(databaseAccount.name),
    primaryContact: nullToUndefined(databaseAccount.primary_contact),
    clientId: nullToUndefined(databaseAccount.client_id),
    createdAt: nullToUndefined(databaseAccount.created_at),
  };
}

/** Page used by {@link listAccounts} when the caller does not specify one. */
const DEFAULT_PAGE = 1;
/** Page size used by {@link listAccounts} when the caller does not specify one. */
const DEFAULT_LIMIT = 50;

/**
 * Lists accounts one page at a time, alongside the pagination metadata the
 * API contract expects. `total` comes from an exact count so `pages` stays
 * correct as accounts are added.
 *
 * @param page - 1-based page number; defaults to the first page
 * @param limit - Accounts per page; defaults to {@link DEFAULT_LIMIT}
 * @returns The requested page of accounts, or an error if the query fails
 */
export async function listAccounts(
  page?: number,
  limit?: number
): Promise<ApiResponse<{ accounts?: Account[]; pagination?: Pagination }>> {
  const resolvedPage = page ?? DEFAULT_PAGE;
  const resolvedLimit = limit ?? DEFAULT_LIMIT;
  const from = (resolvedPage - 1) * resolvedLimit;

  const { data, error, count } = await supabase
    .from("account")
    .select("*", { count: "exact" })
    .range(from, from + resolvedLimit - 1);

  if (error) {
    return { error: { message: error.message ?? "Failed to fetch accounts" } };
  }

  const total = count ?? data.length;

  return {
    data: {
      accounts: data.map(transformAccount),
      pagination: {
        page: resolvedPage,
        limit: resolvedLimit,
        total,
        pages: Math.ceil(total / resolvedLimit),
      },
    },
  };
}

/**
 * Creates an account with a generated UUID and a server-assigned timestamp.
 *
 * @param accountData - New account's details
 * @returns The created account, or a 400 error if the insert is rejected
 */
export async function createAccount(
  accountData: CreateAccountRequest
): Promise<ApiResponse<Account>> {
  const { data, error } = await supabase
    .from("account")
    .insert({
      id: randomUUID(),
      name: accountData.name,
      primary_contact: accountData.primaryContact,
      client_id: accountData.clientId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { error: { message: error.message, statusCode: 400 } };
  }

  return { data: transformAccount(data) };
}

/**
 * Fetches a single account by id.
 *
 * @param id - The account's UUID
 * @returns The account, or a 404 error when no row matches
 */
export async function getAccountById(
  id: string
): Promise<ApiResponse<Account>> {
  const { data, error } = await supabase
    .from("account")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return {
      error: {
        message: error.message ?? "Failed to fetch account",
        statusCode: 404,
      },
    };
  }

  return { data: transformAccount(data) };
}

/**
 * Applies a partial update to an account. Only fields present on
 * `accountData` are written, so omitted fields keep their stored values.
 *
 * @param id - The account's UUID
 * @param accountData - Fields to change
 * @returns The updated account, or an error if the update fails
 */
export async function updateAccount(
  id: string,
  accountData: UpdateAccountRequest
): Promise<ApiResponse<Account>> {
  const updateData: Partial<AccountUpdate> = {};

  if (accountData.name !== undefined) {
    updateData.name = accountData.name;
  }
  if (accountData.primaryContact !== undefined) {
    updateData.primary_contact = accountData.primaryContact;
  }
  if (accountData.clientId !== undefined) {
    updateData.client_id = accountData.clientId;
  }

  const { data, error } = await supabase
    .from("account")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: { message: error.message ?? "Failed to update account" } };
  }

  return { data: transformAccount(data) };
}

/**
 * Deletes an account.
 *
 * @param id - The account's UUID
 * @returns An empty response, or an error if the delete fails
 */
export async function deleteAccount(id: string): Promise<ApiResponse<void>> {
  const { error } = await supabase.from("account").delete().eq("id", id);

  if (error) {
    return { error: { message: error.message ?? "Failed to delete account" } };
  }

  return {};
}

/**
 * Accounts belonging to a user. Delegates to the user domain model, which owns
 * the user → account relationship.
 *
 * @param userId - The user's UUID
 * @returns The user's accounts with a total count, or a 404 if the user is unknown
 */
export async function listUserAccounts(
  userId: string
): Promise<ApiResponse<{ accounts?: Account[]; total?: number }>> {
  return await listAccountsForUser(userId);
}
