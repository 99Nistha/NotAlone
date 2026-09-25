import { NextRequest, NextResponse } from "next/server";
import { normalizeCondition } from "@/lib/anthropic";
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

    // Normalize condition using Claude
    const conditionName = await normalizeCondition(description);

    // Find existing group or create new one
    const { data: existingGroups } = await supabase
      .from("groups")
      .select("*")
      .ilike("condition_name", `%${conditionName.split(" ")[0]}%`)
      .limit(1);

    let group = existingGroups?.[0];

    if (!group) {
      const { data: newGroup, error: groupError } = await supabase
        .from("groups")
        .insert({ condition_name: conditionName })
        .select()
        .single();

      if (groupError) throw groupError;
      group = newGroup;
    }

    // Add user to group
    await supabase
      .from("group_members")
      .upsert({
        user_id: user.id,
        group_id: group.id,
        child_id: childId || null,
      });

    // Update child with normalized condition
    if (childId) {
      await supabase
        .from("children")
        .update({ condition_normalized: conditionName })
        .eq("id", childId)
        .eq("parent_id", user.id);
    }

    return NextResponse.json({ conditionName, group });
  } catch (err) {
    console.error("match-condition error:", err);
    return NextResponse.json(
      { error: "Failed to match condition" },
      { status: 500 }
    );
  }
}
