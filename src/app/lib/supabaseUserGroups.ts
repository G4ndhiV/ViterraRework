import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserGroup } from "./userGroups";

type GroupRow = {
  id: string;
  name: string;
  leader_id: string;
  created_at: string;
  deleted_at: string | null;
};

type GroupMemberRow = {
  group_id: string;
  user_id: string;
};

export async function fetchActiveUserGroups(client: SupabaseClient): Promise<{
  data: UserGroup[];
  error: { message: string } | null;
}> {
  const groupsRes = await client
    .from("user_groups")
    .select("id,name,leader_id,created_at,deleted_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (groupsRes.error) {
    return { data: [], error: { message: groupsRes.error.message } };
  }

  const membersRes = await client
    .from("user_group_members")
    .select("group_id,user_id")
    .order("group_id", { ascending: true });
  if (membersRes.error) {
    return { data: [], error: { message: membersRes.error.message } };
  }

  const membersByGroup = new Map<string, string[]>();
  for (const row of (membersRes.data ?? []) as GroupMemberRow[]) {
    const list = membersByGroup.get(row.group_id) ?? [];
    list.push(row.user_id);
    membersByGroup.set(row.group_id, list);
  }

  const groups: UserGroup[] = ((groupsRes.data ?? []) as GroupRow[]).map((row) => {
    const memberIds = membersByGroup.get(row.id) ?? [];
    return {
      id: row.id,
      name: row.name,
      leaderId: row.leader_id,
      memberIds: Array.from(new Set([...memberIds, row.leader_id])),
      createdAt: row.created_at,
    };
  });

  return { data: groups, error: null };
}

export async function upsertUserGroup(client: SupabaseClient, group: UserGroup) {
  const groupRes = await client.from("user_groups").upsert(
    {
      id: group.id,
      name: group.name,
      leader_id: group.leaderId,
      created_at: group.createdAt,
      deleted_at: null,
    },
    { onConflict: "id" }
  );
  if (groupRes.error) return { error: groupRes.error };

  const delMembersRes = await client.from("user_group_members").delete().eq("group_id", group.id);
  if (delMembersRes.error) return { error: delMembersRes.error };

  const uniqueMembers = Array.from(new Set([...group.memberIds, group.leaderId]));
  if (uniqueMembers.length === 0) return { error: null };

  const insMembersRes = await client.from("user_group_members").insert(
    uniqueMembers.map((userId) => ({
      group_id: group.id,
      user_id: userId,
    }))
  );
  if (insMembersRes.error) return { error: insMembersRes.error };

  return { error: null };
}

export async function softDeleteUserGroup(client: SupabaseClient, groupId: string) {
  const now = new Date().toISOString();
  const res = await client.from("user_groups").update({ deleted_at: now }).eq("id", groupId);
  if (res.error) return { error: res.error };
  const membersRes = await client.from("user_group_members").delete().eq("group_id", groupId);
  return { error: membersRes.error ?? null };
}
