import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DMView from "./DMView";

export default async function DMPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get the other user's profile
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", userId)
    .single();

  if (!otherProfile) redirect("/dashboard");

  // Get initial messages (last 50, ascending)
  const { data: messages } = await supabase
    .from("direct_messages")
    .select("*, profiles!direct_messages_sender_id_fkey(full_name)")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`
    )
    .order("created_at", { ascending: false })
    .limit(50)
    .then(({ data, error }) => ({
      data: data ? [...data].reverse() : [],
      error,
    }));

  // Get current user's profile for display name
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <DMView
      otherUserId={userId}
      otherUserName={otherProfile.full_name ?? "Member"}
      initialMessages={messages ?? []}
      currentUserId={user.id}
      currentUserName={myProfile?.full_name ?? user.email ?? "You"}
    />
  );
}
