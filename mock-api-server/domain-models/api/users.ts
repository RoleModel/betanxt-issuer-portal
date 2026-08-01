import { randomUUID } from "node:crypto";

import type { components } from "@/types/api";
import type { Database } from "@/utils/supabase/database.types";

import { supabase } from "@/utils/supabase/client";

// Use generated types from OpenAPI schema
type User = components["schemas"]["User"];
type CreateUserRequest = components["schemas"]["CreateUserRequest"];
type UpdateUserRequest = components["schemas"]["UpdateUserRequest"];
type CreateAccountUserRequest =
  components["schemas"]["CreateAccountUserRequest"];
type Account = components["schemas"]["Account"];
type UserRow = Database["public"]["Tables"]["user"]["Row"];
type UserUpdate = Database["public"]["Tables"]["user"]["Update"];

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
 * Maps a `user` row onto the OpenAPI `User` shape, converting snake_case
 * columns to camelCase and nulls to undefined. The `password` column is
 * deliberately not surfaced.
 *
 * @param databaseUser - Raw row from the `user` table
 * @returns The user in API representation
 */
function transformUser(databaseUser: UserRow): User {
  return {
    id: nullToUndefined(databaseUser.id),
    username: nullToUndefined(databaseUser.username),
    firstName: nullToUndefined(databaseUser.first_name),
    lastName: nullToUndefined(databaseUser.last_name),
    email: nullToUndefined(databaseUser.email),
    type: nullToUndefined(databaseUser.type) as User["type"],
    accountId: databaseUser.account_id,
    avatar_url: databaseUser.avatar_url,
  };
}

/**
 * Lists users, optionally narrowed to one account and/or one user type.
 *
 * @param accountId - Restrict to users belonging to this account
 * @param type - Restrict to users of this type (ADMIN, ISSUER, …)
 * @returns Matching users, or an error if the query fails
 */
export async function listUsers(
  accountId?: string,
  type?: User["type"]
): Promise<ApiResponse<User[]>> {
  let query = supabase.from("user").select("*");

  if (accountId !== undefined) {
    query = query.eq("account_id", accountId);
  }
  if (type !== undefined) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    return { error: { message: error.message ?? "Failed to fetch users" } };
  }

  return { data: data.map(transformUser) };
}

/**
 * Creates a user with a generated UUID.
 *
 * @param body - New user's details; `accountId` may be omitted for unaffiliated users
 * @returns The created user, or a 400 error if the insert is rejected
 */
export async function createUser(
  body: CreateUserRequest
): Promise<ApiResponse<User>> {
  const { data, error } = await supabase
    .from("user")
    .insert({
      id: randomUUID(),
      username: body.username,
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      password: body.password,
      type: body.type,
      account_id: body.accountId ?? null,
    })
    .select()
    .single();

  if (error) {
    return { error: { message: error.message, statusCode: 400 } };
  }

  return { data: transformUser(data) };
}

/**
 * Fetches a single user by id.
 *
 * @param id - The user's UUID
 * @returns The user, or a 404 error when no row matches
 */
export async function getUserById(id: string): Promise<ApiResponse<User>> {
  const { data, error } = await supabase
    .from("user")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return {
      error: {
        message: error.message ?? "Failed to fetch user",
        statusCode: 404,
      },
    };
  }

  return { data: transformUser(data) };
}

/**
 * Applies a partial update to a user. Only fields present on `body` are
 * written, so omitted fields keep their stored values.
 *
 * Note that `UpdateUserRequest` carries no `username`, so usernames cannot be
 * changed here — add the field to the OpenAPI schema first if that is needed.
 *
 * @param id - The user's UUID
 * @param body - Fields to change
 * @returns The updated user, or an error if the update fails
 */
export async function updateUser(
  id: string,
  body: UpdateUserRequest
): Promise<ApiResponse<User>> {
  const updateData: Partial<UserUpdate> = {};

  if (body.firstName !== undefined) {
    updateData.first_name = body.firstName;
  }
  if (body.lastName !== undefined) {
    updateData.last_name = body.lastName;
  }
  if (body.email !== undefined) {
    updateData.email = body.email;
  }
  if (body.type !== undefined) {
    updateData.type = body.type;
  }
  if (body.accountId !== undefined) {
    updateData.account_id = body.accountId;
  }

  const { data, error } = await supabase
    .from("user")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: { message: error.message ?? "Failed to update user" } };
  }

  return { data: transformUser(data) };
}

/**
 * Deletes a user.
 *
 * @param id - The user's UUID
 * @returns An empty response, or an error if the delete fails
 */
export async function deleteUser(id: string): Promise<ApiResponse<void>> {
  const { error } = await supabase.from("user").delete().eq("id", id);

  if (error) {
    return { error: { message: error.message ?? "Failed to delete user" } };
  }

  return {};
}

/**
 * Lists every user attached to an account.
 *
 * @param accountId - The account's UUID
 * @returns Users belonging to the account, or an error if the query fails
 */
export async function listAccountUsers(
  accountId: string
): Promise<ApiResponse<User[]>> {
  const { data, error } = await supabase
    .from("user")
    .select("*")
    .eq("account_id", accountId);

  if (error) {
    return { error: { message: error.message ?? "Failed to fetch users" } };
  }

  return { data: data.map(transformUser) };
}

/**
 * Creates a user already attached to an account.
 *
 * @param accountId - Account the new user belongs to
 * @param body - New user's details
 * @returns The created user, or a 400 error if the insert is rejected
 */
export async function createAccountUser(
  accountId: string,
  body: CreateAccountUserRequest
): Promise<ApiResponse<User>> {
  return await createUser({ ...body, accountId });
}

/**
 * Lists the accounts a user belongs to. A user currently holds at most one
 * account (`user.account_id`), so this returns zero or one account, but the
 * collection shape is kept for the API contract.
 *
 * @param userId - The user's UUID
 * @returns The user's accounts with a total count, or a 404 if the user is unknown
 */
export async function listUserAccounts(
  userId: string
): Promise<ApiResponse<{ accounts?: Account[]; total?: number }>> {
  const { data: user, error: userError } = await supabase
    .from("user")
    .select("account_id")
    .eq("id", userId)
    .single();

  if (userError) {
    return {
      error: {
        message: userError.message ?? "Failed to fetch user accounts",
        statusCode: 404,
      },
    };
  }

  if (user.account_id === null) {
    return { data: { accounts: [], total: 0 } };
  }

  const { data: accounts, error: accountsError } = await supabase
    .from("account")
    .select("*")
    .eq("id", user.account_id);

  if (accountsError) {
    return {
      error: {
        message: accountsError.message ?? "Failed to fetch user accounts",
      },
    };
  }

  const transformed: Account[] = accounts.map((account) => ({
    id: nullToUndefined(account.id),
    name: nullToUndefined(account.name),
    primaryContact: nullToUndefined(account.primary_contact),
    clientId: nullToUndefined(account.client_id),
    createdAt: nullToUndefined(account.created_at),
  }));

  return { data: { accounts: transformed, total: transformed.length } };
}
