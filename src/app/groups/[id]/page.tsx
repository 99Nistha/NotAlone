import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GroupView from "./GroupView";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get group
  const { data: group, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !group) redirect("/dashboard");

  // Live member count
  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", id);

  group.member_count = count ?? 0;

  // Get initial messages (most recent 50, ascending so chat reads top→bottom)
  const { data: messages } = await supabase
    .from("messages")
    .select("*, profiles(full_name)")
    .eq("group_id", id)
    .order("created_at", { ascending: false })
    .limit(50)
    .then(({ data, error }) => ({
      data: data ? [...data].reverse() : [],
      error,
    }));

  // Get initial resources
  const { data: resources } = await supabase
    .from("resources")
    .select("*, profiles(full_name)")
    .eq("group_id", id)
    .order("created_at", { ascending: false });

  // Get profile for current user
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <GroupView
      group={group}
      initialMessages={messages ?? []}
      initialResources={resources ?? []}
      userId={user.id}
      userFullName={profile?.full_name ?? user.email ?? "You"}
    />
  );
}
