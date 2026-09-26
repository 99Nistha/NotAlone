import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeCondition } from "@/lib/conditionMatcher";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, age, condition_description } = await request.json();

  // Build update payload
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (age !== undefined) updates.age = age ? parseInt(age) : null;

  // If condition description changed, re-run matcher and re-assign group
  if (condition_description !== undefined) {
    updates.condition_description = condition_description;

    if (condition_description.trim()) {
      const conditionName = normalizeCondition(condition_description);
      updates.condition_normalized = conditionName;

      // Find or create group (exact match on normalized name)
      const { data: existing } = await supabase
        .from("groups")
        .select("id")
        .eq("condition_name", conditionName)
        .limit(1);

      let groupId: string;
      if (existing?.[0]) {
        groupId = existing[0].id;
      } else {
        const { data: newGroup } = await supabase
          .from("groups")
          .insert({ condition_name: conditionName })
          .select("id")
          .single();
        groupId = newGroup!.id;
      }

      // Remove old group memberships for this child, add new one
      await supabase
        .from("group_members")
        .delete()
        .eq("user_id", user.id)
        .eq("child_id", id);

      await supabase
        .from("group_members")
        .upsert({ user_id: user.id, group_id: groupId, child_id: id });
    }
  }

  const { data, error } = await supabase
    .from("children")
    .update(updates)
    .eq("id", id)
    .eq("parent_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ child: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Remove group memberships tied to this child first
  await supabase.from("group_members").delete().eq("child_id", id).eq("user_id", user.id);

  // Delete the child record (only if owned by this user)
  const { error } = await supabase
    .from("children")
    .delete()
    .eq("id", id)
    .eq("parent_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
