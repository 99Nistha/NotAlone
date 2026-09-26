export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Heart, MessageCircle, Users, ArrowRight, PlusCircle, Pencil, Settings } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

interface DMThread {
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageAt: string;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get user's groups via group_members
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  const groupIds = memberships?.map((m) => m.group_id) ?? [];

  const { data: groupsData } = groupIds.length
    ? await supabase.from("groups").select("*").in("id", groupIds)
    : { data: [] };

  // Count members live — don't trust the denormalized member_count column
  const { data: memberCounts } = groupIds.length
    ? await supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", groupIds)
    : { data: [] };

  const memberCountMap: Record<string, number> = {};
  memberCounts?.forEach(({ group_id }) => {
    memberCountMap[group_id] = (memberCountMap[group_id] ?? 0) + 1;
  });

  const groups = (groupsData ?? []).map((g) => ({
    ...g,
    member_count: memberCountMap[g.id] ?? 0,
  })) as Array<{
    id: string;
    condition_name: string;
    member_count: number;
    description: string | null;
  }>;

  // Get last message per group for preview
  const lastMessagesByGroup: Record<string, { content: string; created_at: string }> = {};
  if (groupIds.length) {
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("group_id, content, created_at")
      .in("group_id", groupIds)
      .order("created_at", { ascending: false })
      .limit(groupIds.length * 5); // fetch a few per group

    recentMessages?.forEach((msg) => {
      if (!lastMessagesByGroup[msg.group_id]) {
        lastMessagesByGroup[msg.group_id] = { content: msg.content, created_at: msg.created_at };
      }
    });
  }

  // Get DM threads — latest message per unique conversation
  const { data: dmMessages } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, content, created_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  // Deduplicate: keep only the latest message per conversation partner
  const dmThreadMap: Record<string, { content: string; created_at: string; otherUserId: string }> = {};
  dmMessages?.forEach((msg) => {
    const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
    if (!dmThreadMap[otherUserId]) {
      dmThreadMap[otherUserId] = { content: msg.content, created_at: msg.created_at, otherUserId };
    }
  });

  // Fetch names of other users
  const dmUserIds = Object.keys(dmThreadMap);
  const { data: dmProfiles } = dmUserIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", dmUserIds)
    : { data: [] };

  const dmProfileMap: Record<string, string> = {};
  dmProfiles?.forEach((p) => { dmProfileMap[p.id] = p.full_name ?? "Member"; });

  const dmThreads: DMThread[] = Object.values(dmThreadMap).map((t) => ({
    otherUserId: t.otherUserId,
    otherUserName: dmProfileMap[t.otherUserId] ?? "Member",
    lastMessage: t.content,
    lastMessageAt: t.created_at,
  }));

  // Get user's children
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("parent_id", user.id);

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const hasChildren = (children?.length ?? 0) > 0;
  const hasGroups = groups.length > 0;

  return (
    <div className="min-h-screen bg-[#faf9ff]">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="text-rose-500" size={22} fill="currentColor" />
            <span className="text-lg font-bold text-gray-900">Not Alone</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              {profile?.full_name || user.email}
            </span>
            <Link href="/settings" className="text-gray-400 hover:text-gray-700 transition-colors" title="Account settings">
              <Settings size={18} />
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-gray-500 mt-1">Your community is here for you.</p>
        </div>

        {/* Empty state — no children yet */}
        {!hasChildren && (
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-8 text-center mb-8">
            <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="text-violet-600" size={28} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Start by adding your child
            </h2>
            <p className="text-gray-600 mb-6">
              Tell us about your child&apos;s condition and we&apos;ll connect you with the right families.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Add my child <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {/* Children */}
        {hasChildren && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your children</h2>
              <Link
                href="/onboarding"
                className="text-sm text-violet-600 hover:underline flex items-center gap-1"
              >
                <PlusCircle size={14} /> Add another
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {children!.map((child) => (
                <div
                  key={child.id}
                  className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">{child.name}</div>
                      {child.age && (
                        <div className="text-sm text-gray-500">Age {child.age}</div>
                      )}
                    </div>
                    <Link
                      href={`/children/${child.id}/edit`}
                      className="text-gray-400 hover:text-violet-600 transition-colors p-1 rounded-lg hover:bg-violet-50"
                      title="Edit profile"
                    >
                      <Pencil size={15} />
                    </Link>
                  </div>
                  {child.condition_normalized && (
                    <div className="mt-2 inline-block bg-violet-50 text-violet-700 text-xs font-medium px-3 py-1 rounded-full">
                      {child.condition_normalized}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Groups */}
        {hasGroups && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your groups</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors leading-tight">
                      {group.condition_name}
                    </div>
                    <ArrowRight className="text-gray-400 group-hover:text-violet-600 transition-colors flex-shrink-0 ml-2" size={18} />
                  </div>

                  {/* Last message preview */}
                  {lastMessagesByGroup[group.id] ? (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      &ldquo;{lastMessagesByGroup[group.id].content}&rdquo;
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic mb-3">
                      No messages yet — be the first to say hello!
                    </p>
                  )}

                  <div className="flex gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users size={13} /> {group.member_count} {group.member_count === 1 ? "member" : "members"}
                    </span>
                    {lastMessagesByGroup[group.id] && (
                      <span className="flex items-center gap-1 ml-auto text-xs">
                        <MessageCircle size={12} />
                        {new Date(lastMessagesByGroup[group.id].created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Direct Messages */}
        {dmThreads.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Direct messages</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {dmThreads.map((thread) => (
                <Link
                  key={thread.otherUserId}
                  href={`/messages/${thread.otherUserId}`}
                  className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors leading-tight">
                      {thread.otherUserName}
                    </div>
                    <ArrowRight className="text-gray-400 group-hover:text-violet-600 transition-colors flex-shrink-0 ml-2" size={18} />
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    &ldquo;{thread.lastMessage}&rdquo;
                  </p>
                  <div className="flex justify-end">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MessageCircle size={12} />
                      {new Date(thread.lastMessageAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Has children but no groups — shouldn't usually happen */}
        {hasChildren && !hasGroups && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 text-center">
            <p className="text-gray-700">
              Your group is being set up. Try refreshing in a moment.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
