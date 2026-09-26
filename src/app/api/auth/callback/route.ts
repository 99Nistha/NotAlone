import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Handles Supabase auth redirects:
// - Email confirmation links
// - Password reset links
// - Magic links
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send to login with error hint
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
