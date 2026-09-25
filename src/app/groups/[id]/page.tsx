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

  // Get initial messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*, profiles(full_name)")
    .eq("group_id", id)
    .order("created_at", { ascending: true })
    .limit(50);

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
