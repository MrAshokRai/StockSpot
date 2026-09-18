import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = (notifications || []).filter((n: { is_read: boolean }) => !n.is_read).length;

  return NextResponse.json({ notifications: notifications || [], unread_count: unreadCount });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { notification_ids } = body;

  if (notification_ids && notification_ids.length > 0) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", notification_ids)
      .eq("user_id", user.id);
  } else {
    // Mark all as read
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  }

  return NextResponse.json({ success: true });
}
