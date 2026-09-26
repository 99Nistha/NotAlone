import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get the child_id linked to this membership before deleting
  const { data: membership } = await supabase
    .from("group_members")
    .select("child_id")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Clear condition badge on the child so it no longer shows a group highlight
  if (membership?.child_id) {
    await supabase
      .from("children")
      .update({ condition_normalized: null })
      .eq("id", membership.child_id)
      .eq("parent_id", user.id);
  }

  return NextResponse.json({ success: true });
}
