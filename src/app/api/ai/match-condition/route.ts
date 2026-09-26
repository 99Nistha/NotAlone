import { NextRequest, NextResponse } from "next/server";
import { normalizeCondition } from "@/lib/conditionMatcher";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { description, childId } = await request.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Normalize condition using keyword matcher (no API cost)
    const conditionName = normalizeCondition(description);

    // Find existing group or create new one (exact match on normalized name)
    const { data: existingGroups } = await supabase
      .from("groups")
      .select("*")
      .eq("condition_name", conditionName)
      .limit(1);

    let group = existingGroups?.[0];
    const isNewGroup = !group;

    if (isNewGroup) {
      const { data: newGroup, error: groupError } = await supabase
        .from("groups")
        .insert({ condition_name: conditionName })
        .select()
        .single();

      if (groupError) throw groupError;
      group = newGroup;
    }

    // Add user to group
    const { error: joinError } = await supabase
      .from("group_members")
      .upsert({
        user_id: user.id,
        group_id: group.id,
        child_id: childId || null,
      });

    // Insert a system join message so group members see "X joined"
    if (!joinError && !isNewGroup) {
      await supabase.from("messages").insert({
        group_id: group.id,
        user_id: user.id,
        content: "[[joined]]",
      });
    }

    // Update child with normalized condition
    if (childId) {
      await supabase
        .from("children")
        .update({ condition_normalized: conditionName })
        .eq("id", childId)
        .eq("parent_id", user.id);
    }

    return NextResponse.json({ conditionName, group, isNewGroup });
  } catch (err) {
    console.error("match-condition error:", err);
    return NextResponse.json(
      { error: "Failed to match condition" },
      { status: 500 }
    );
  }
}
