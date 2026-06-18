import type { SupabaseClient } from "@supabase/supabase-js";

export type TokkoPropertyTypeRow = {
  id: string;
  tokko_type_id: string;
  code: string | null;
  name: string;
  payload: Record<string, unknown>;
  synced_at: string;
  updated_at: string;
};

export type TokkoDevelopmentTypeRow = {
  id: string;
  tokko_type_id: string;
  code: string | null;
  name: string;
  payload: Record<string, unknown>;
  synced_at: string;
  updated_at: string;
};

export type TokkoPropertyTagRow = {
  id: string;
  tokko_tag_id: string;
  name: string;
  tag_type: number | null;
  payload: Record<string, unknown>;
  synced_at: string;
  updated_at: string;
};

export async function fetchTokkoPropertyTypes(client: SupabaseClient) {
  return client.from("tokko_property_types").select("*").order("name");
}

export async function fetchTokkoDevelopmentTypes(client: SupabaseClient) {
  return client.from("tokko_development_types").select("*").order("name");
}

export async function fetchTokkoPropertyTags(client: SupabaseClient) {
  return client.from("tokko_property_tags").select("*").order("name");
}
